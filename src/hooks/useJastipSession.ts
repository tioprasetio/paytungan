import { useState, useCallback, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { jastipApi } from '../api/jastip.api';
import { JastipSession, OrderItem } from '../types';
import { SOCKET_URL } from '../config/api.config';

export const useJastipSession = (sessionId: number, userId?: number) => {
  const [currentSession, setCurrentSession] = useState<JastipSession | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await jastipApi.getSessionById(sessionId);
      setCurrentSession(session);
      setItems(session.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat sesi');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Setup Socket.IO for real-time blind cart updates
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_session', sessionId);
    });

    socket.on('item_added', (data: { sessionId: number; item: OrderItem }) => {
      if (data.sessionId === sessionId) {
        setItems((prev) => {
          if (prev.some((it) => it.id === data.item.id)) return prev;
          return [...prev, data.item];
        });
      }
    });

    socket.on('item_removed', (data: { sessionId: number; itemId: number }) => {
      if (data.sessionId === sessionId) {
        setItems((prev) => prev.filter((it) => it.id !== data.itemId));
      }
    });

    socket.on('session_locked', (data: { sessionId: number; session: JastipSession }) => {
      if (data.sessionId === sessionId) {
        setCurrentSession((prev) => (prev ? { ...prev, status: 'LOCKED' } : data.session));
      }
    });

    socket.on('session_updated', (data: { sessionId: number; session: JastipSession }) => {
      if (data.sessionId === sessionId && data.session) {
        setCurrentSession(data.session);
        if (data.session.items) {
          setItems(data.session.items);
        }
      }
    });

    socket.on('time_extended', (data: { sessionId: number; waktu_tutup: string; session: JastipSession }) => {
      if (data.sessionId === sessionId) {
        setCurrentSession((prev) =>
          prev
            ? { ...prev, waktu_tutup: data.waktu_tutup || null }
            : data.session
        );
      }
    });

    return () => {
      socket.emit('leave_session', sessionId);
      socket.disconnect();
    };
  }, [sessionId]);

  const addItem = async (nama_barang: string, catatan?: string): Promise<OrderItem | null> => {
    if (!userId) throw new Error('User belum login');

    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket belum terhubung'));
        return;
      }

      socketRef.current.emit(
        'add_item',
        {
          sessionId,
          userId,
          nama_barang,
          catatan,
        },
        (res: { success: boolean; item?: OrderItem; message?: string }) => {
          if (res?.success && res.item) {
            setItems((prev) => {
              if (prev.some((it) => it.id === res.item!.id)) return prev;
              return [...prev, res.item!];
            });
            resolve(res.item);
          } else {
            reject(new Error(res?.message || 'Gagal menambahkan barang'));
          }
        }
      );
    });
  };

  const removeItem = async (itemId: number): Promise<void> => {
    if (!userId) throw new Error('User belum login');

    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket belum terhubung'));
        return;
      }

      socketRef.current.emit(
        'remove_item',
        {
          sessionId,
          itemId,
          userId,
        },
        (res: { success: boolean; message?: string }) => {
          if (res?.success) {
            setItems((prev) => prev.filter((it) => it.id !== itemId));
            resolve();
          } else {
            reject(new Error(res?.message || 'Gagal menghapus barang'));
          }
        }
      );
    });
  };

  const extendTime = async (additionalMinutes: number = 5): Promise<JastipSession> => {
    if (!userId) throw new Error('User belum login');

    const updated = await jastipApi.extendTime(sessionId, userId, additionalMinutes);
    setCurrentSession(updated);
    return updated;
  };

  const lockSession = async () => {
    if (!userId) throw new Error('User belum login');
    const updated = await jastipApi.lockSession(sessionId, userId);
    setCurrentSession(updated);
    return updated;
  };

  return {
    currentSession,
    items,
    isLoading,
    error,
    loadSession,
    addItem,
    removeItem,
    extendTime,
    lockSession,
  };
};
