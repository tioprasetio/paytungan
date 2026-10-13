import { apiClient } from './apiClient';
import { Bounty, CreateBountyPayload, ApiResponse } from '../types';

export const bountyApi = {
  createBounty: async (payload: CreateBountyPayload): Promise<Bounty> => {
    const res = await apiClient.post<ApiResponse<Bounty>>('/bounties', payload);
    if (!res.data.data) throw new Error(res.data.message || 'Gagal membuat bounty');
    return res.data.data;
  },

  getCircleBounties: async (circleId: number): Promise<Bounty[]> => {
    const res = await apiClient.get<ApiResponse<Bounty[]>>(`/bounties/circle/${circleId}`);
    return res.data.data || [];
  },

  getUserActiveBounties: async (userId: number): Promise<Bounty[]> => {
    const res = await apiClient.get<ApiResponse<Bounty[]>>(`/bounties/active/user/${userId}`);
    return res.data.data || [];
  },

  getFeedBounties: async (userId: number): Promise<Bounty[]> => {
    const res = await apiClient.get<ApiResponse<Bounty[]>>(`/bounties/feed/user/${userId}`);
    return res.data.data || [];
  },

  getBountyById: async (id: number): Promise<Bounty> => {
    const res = await apiClient.get<ApiResponse<Bounty>>(`/bounties/${id}`);
    if (!res.data.data) throw new Error(res.data.message || 'Bounty tidak ditemukan');
    return res.data.data;
  },

  claimBounty: async (id: number, runnerId: number): Promise<Bounty> => {
    const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/claim`, { runnerId });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal mengambil bounty');
    return res.data.data;
  },

  releaseBounty: async (id: number, runnerId: number): Promise<Bounty> => {
    const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/release`, { runnerId });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal membatalkan pengambilan tugas');
    return res.data.data;
  },

  completePurchase: async (
    id: number,
    payload: FormData | { runnerId: number; harga_final: number; bukti_struk?: string }
  ): Promise<Bounty> => {
    if (payload instanceof FormData) {
      const res = await apiClient.post<ApiResponse<Bounty>>(
        `/bounties/${id}/complete-purchase`,
        payload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      if (!res.data.data) throw new Error(res.data.message || 'Gagal menyelesaikan pembelian');
      return res.data.data;
    } else {
      const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/complete-purchase`, payload);
      if (!res.data.data) throw new Error(res.data.message || 'Gagal menyelesaikan pembelian');
      return res.data.data;
    }
  },

  submitPayment: async (
    id: number,
    payload: FormData | { userId: number; bukti_bayar?: string }
  ): Promise<Bounty> => {
    if (payload instanceof FormData) {
      const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/pay`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!res.data.data) throw new Error(res.data.message || 'Gagal mengirim pembayaran');
      return res.data.data;
    } else {
      const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/pay`, payload);
      if (!res.data.data) throw new Error(res.data.message || 'Gagal mengirim pembayaran');
      return res.data.data;
    }
  },

  finishBounty: async (id: number, userId: number): Promise<Bounty> => {
    const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/finish`, { userId });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal menyelesaikan tugas');
    return res.data.data;
  },

  cancelBounty: async (id: number, userId: number): Promise<Bounty> => {
    const res = await apiClient.post<ApiResponse<Bounty>>(`/bounties/${id}/cancel`, { userId });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal membatalkan tugas');
    return res.data.data;
  },
};
