import { apiClient } from './apiClient';
import { SplitBillRecapResponse, ApiResponse } from '../types';

export const splitBillApi = {
  getRecap: async (sessionId: number): Promise<SplitBillRecapResponse> => {
    const res = await apiClient.get<ApiResponse<SplitBillRecapResponse>>(
      `/split-bill/${sessionId}/recap`
    );
    if (!res.data.data) throw new Error(res.data.message || 'Gagal memuat rekap split bill');
    return res.data.data;
  },

  updateItemPayment: async (itemId: number, status_bayar: boolean, sessionId?: number): Promise<void> => {
    await apiClient.patch(`/split-bill/items/${itemId}/payment`, {
      status_bayar,
      sessionId,
    });
  },

  updateUserPaymentBatch: async (
    sessionId: number,
    userId: number,
    status_bayar: boolean
  ): Promise<void> => {
    await apiClient.patch(`/split-bill/${sessionId}/user-payment`, {
      userId,
      status_bayar,
    });
  },

  uploadProof: async (
    sessionId: number,
    payload: FormData | { userId: number; image_base64?: string; catatan?: string }
  ): Promise<void> => {
    if (payload instanceof FormData) {
      await apiClient.post(`/split-bill/${sessionId}/upload-proof`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      await apiClient.post(`/split-bill/${sessionId}/upload-proof`, payload);
    }
  },

  verifyProof: async (
    sessionId: number,
    payload: {
      verifierUserId: number;
      targetUserId: number;
      action: 'APPROVE' | 'REJECT';
      alasanTolak?: string;
    }
  ): Promise<void> => {
    await apiClient.post(`/split-bill/${sessionId}/verify-proof`, payload);
  },
};
