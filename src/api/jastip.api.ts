import { apiClient } from './apiClient';
import { JastipSession, OrderItem, ApiResponse } from '../types';

export const jastipApi = {
  getCircleSessions: async (circleId: number): Promise<JastipSession[]> => {
    const res = await apiClient.get<ApiResponse<JastipSession[]>>(`/circles/${circleId}`);
    return res.data.data ? (res.data.data as any).sessions || [] : [];
  },

  getUserActiveSessions: async (userId: number): Promise<JastipSession[]> => {
    const res = await apiClient.get<ApiResponse<JastipSession[]>>(`/jastip/user/${userId}/active`);
    return res.data.data || [];
  },

  getSessionById: async (sessionId: number): Promise<JastipSession> => {
    const res = await apiClient.get<ApiResponse<JastipSession>>(`/jastip/${sessionId}`);
    if (!res.data.data) throw new Error(res.data.message || 'Sesi tidak ditemukan');
    return res.data.data;
  },

  createSession: async (payload: {
    circleId: number;
    creatorId: number;
    lokasi: string;
    tarif_jastip: number;
    waktu_tutup?: string | null;
  }): Promise<JastipSession> => {
    const res = await apiClient.post<ApiResponse<JastipSession>>('/jastip/create', payload);
    if (!res.data.data) throw new Error(res.data.message || 'Gagal membuka sesi jastip');
    return res.data.data;
  },

  lockSession: async (sessionId: number, userId: number): Promise<JastipSession> => {
    const res = await apiClient.post<ApiResponse<JastipSession>>(`/jastip/${sessionId}/lock`, {
      userId,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal mengunci sesi');
    return res.data.data;
  },

  extendTime: async (
    sessionId: number,
    userId: number,
    additionalMinutes: number = 5
  ): Promise<JastipSession> => {
    const res = await apiClient.post<ApiResponse<JastipSession>>(`/jastip/${sessionId}/extend-time`, {
      userId,
      additionalMinutes,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal memperpanjang waktu sesi');
    return res.data.data;
  },

  inputPrices: async (
    sessionId: number,
    userId: number,
    prices: Array<{ itemId: number; harga_final: number }>
  ): Promise<OrderItem[]> => {
    const res = await apiClient.post<ApiResponse<OrderItem[]>>(`/jastip/${sessionId}/prices`, {
      userId,
      prices,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal menyimpan harga');
    return res.data.data;
  },

  completeSession: async (sessionId: number, userId: number): Promise<JastipSession> => {
    const res = await apiClient.post<ApiResponse<JastipSession>>(`/jastip/${sessionId}/complete`, {
      userId,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal menyelesaikan sesi');
    return res.data.data;
  },

  getUserHistory: async (
    userId: number,
    role: 'penitip' | 'jastiper' | 'all' = 'penitip'
  ): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(`/jastip/user/${userId}/history?role=${role}`);
    return res.data.data;
  },
};

