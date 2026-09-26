import { useState, useCallback } from 'react';
import { splitBillApi } from '../api/splitBill.api';
import { SplitBillRecapResponse } from '../types';

export const useSplitBill = (sessionId: number) => {
  const [recap, setRecap] = useState<SplitBillRecapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await splitBillApi.getRecap(sessionId);
      setRecap(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat rekap');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const toggleItemPayment = async (itemId: number, currentStatus: boolean) => {
    await splitBillApi.updateItemPayment(itemId, !currentStatus);
    await fetchRecap();
  };

  const toggleUserPaymentBatch = async (userId: number, currentStatus: boolean) => {
    await splitBillApi.updateUserPaymentBatch(sessionId, userId, !currentStatus);
    await fetchRecap();
  };

  const uploadProof = async (
    payload: FormData | { userId: number; image_base64?: string; catatan?: string }
  ) => {
    await splitBillApi.uploadProof(sessionId, payload);
    await fetchRecap();
  };

  const verifyProof = async (payload: {
    verifierUserId: number;
    targetUserId: number;
    action: 'APPROVE' | 'REJECT';
    alasanTolak?: string;
  }) => {
    await splitBillApi.verifyProof(sessionId, payload);
    await fetchRecap();
  };

  return {
    recap,
    isLoading,
    error,
    fetchRecap,
    toggleItemPayment,
    toggleUserPaymentBatch,
    uploadProof,
    verifyProof,
  };
};
