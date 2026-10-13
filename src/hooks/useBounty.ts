import { useState, useCallback, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { bountyApi } from '../api/bounty.api';
import { Bounty, CreateBountyPayload } from '../types';
import { SOCKET_URL } from '../config/api.config';

export const useBounty = (
  circleId?: number,
  userId?: number,
  options?: { onlyMyActive?: boolean }
) => {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchBounties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (circleId) {
        const data = await bountyApi.getCircleBounties(circleId);
        setBounties(data);
      } else if (userId) {
        if (options?.onlyMyActive) {
          const data = await bountyApi.getUserActiveBounties(userId);
          setBounties(data);
        } else {
          const data = await bountyApi.getFeedBounties(userId);
          setBounties(data);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat bounty');
    } finally {
      setIsLoading(false);
    }
  }, [circleId, userId, options?.onlyMyActive]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  // Real-time socket updates for bounties
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (circleId) {
        socket.emit('join_circle', circleId);
      }
    });

    socket.on('bounty_created', (newBounty: Bounty) => {
      if (!circleId || newBounty.circleId === circleId) {
        setBounties((prev) => {
          if (prev.some((b) => b.id === newBounty.id)) return prev;
          return [newBounty, ...prev];
        });
      }
    });

    socket.on('bounty_claimed', (updatedBounty: Bounty) => {
      setBounties((prev) =>
        prev.map((b) => (b.id === updatedBounty.id ? updatedBounty : b))
      );
    });

    socket.on('bounty_updated', (updatedBounty: Bounty) => {
      setBounties((prev) =>
        prev.map((b) => (b.id === updatedBounty.id ? updatedBounty : b))
      );
    });

    return () => {
      if (circleId) {
        socket.emit('leave_circle', circleId);
      }
      socket.disconnect();
    };
  }, [circleId]);

  const createBounty = async (payload: CreateBountyPayload) => {
    const created = await bountyApi.createBounty(payload);
    setBounties((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
    return created;
  };

  const claimBounty = async (bountyId: number) => {
    if (!userId) throw new Error('Pengguna tidak valid');
    const updated = await bountyApi.claimBounty(bountyId, userId);
    setBounties((prev) => prev.map((b) => (b.id === bountyId ? updated : b)));
    return updated;
  };

  const releaseBounty = async (bountyId: number) => {
    if (!userId) throw new Error('Pengguna tidak valid');
    const updated = await bountyApi.releaseBounty(bountyId, userId);
    setBounties((prev) => prev.map((b) => (b.id === bountyId ? updated : b)));
    return updated;
  };

  const completePurchase = async (
    bountyId: number,
    hargaFinal: number,
    receiptUri?: string
  ) => {
    if (!userId) throw new Error('Pengguna tidak valid');

    let updated: Bounty;
    if (receiptUri) {
      const formData = new FormData();
      formData.append('runnerId', String(userId));
      formData.append('harga_final', String(hargaFinal));
      formData.append('bukti', {
        uri: receiptUri,
        type: 'image/jpeg',
        name: `bounty_receipt_${bountyId}.jpg`,
      } as any);
      updated = await bountyApi.completePurchase(bountyId, formData);
    } else {
      updated = await bountyApi.completePurchase(bountyId, {
        runnerId: userId,
        harga_final: hargaFinal,
      });
    }

    setBounties((prev) => prev.map((b) => (b.id === bountyId ? updated : b)));
    return updated;
  };

  const submitPayment = async (bountyId: number, proofUri?: string) => {
    if (!userId) throw new Error('Pengguna tidak valid');

    let updated: Bounty;
    if (proofUri) {
      const formData = new FormData();
      formData.append('userId', String(userId));
      formData.append('bukti', {
        uri: proofUri,
        type: 'image/jpeg',
        name: `bounty_pay_${bountyId}.jpg`,
      } as any);
      updated = await bountyApi.submitPayment(bountyId, formData);
    } else {
      updated = await bountyApi.submitPayment(bountyId, { userId });
    }

    setBounties((prev) => prev.map((b) => (b.id === bountyId ? updated : b)));
    return updated;
  };

  const finishBounty = async (bountyId: number) => {
    if (!userId) throw new Error('Pengguna tidak valid');
    const updated = await bountyApi.finishBounty(bountyId, userId);
    setBounties((prev) => prev.map((b) => (b.id === bountyId ? updated : b)));
    return updated;
  };

  const cancelBounty = async (bountyId: number) => {
    if (!userId) throw new Error('Pengguna tidak valid');
    const updated = await bountyApi.cancelBounty(bountyId, userId);
    setBounties((prev) => prev.map((b) => (b.id === bountyId ? updated : b)));
    return updated;
  };

  return {
    bounties,
    isLoading,
    error,
    refresh: fetchBounties,
    createBounty,
    claimBounty,
    releaseBounty,
    completePurchase,
    submitPayment,
    finishBounty,
    cancelBounty,
  };
};
