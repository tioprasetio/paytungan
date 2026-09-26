import { apiClient } from './apiClient';
import { Circle, ApiResponse } from '../types';

export const circleApi = {
  getUserCircles: async (userId: number): Promise<Circle[]> => {
    const res = await apiClient.get<ApiResponse<Circle[]>>(`/circles/user/${userId}`);
    return res.data.data || [];
  },

  getCircleById: async (circleId: number, userId?: number): Promise<Circle> => {
    const query = userId ? `?userId=${userId}` : '';
    const res = await apiClient.get<ApiResponse<Circle>>(`/circles/${circleId}${query}`);
    if (!res.data.data) throw new Error(res.data.message || 'Sirkel tidak ditemukan');
    return res.data.data;
  },

  createCircle: async (nama_sirkel: string, userId: number): Promise<Circle> => {
    const res = await apiClient.post<ApiResponse<Circle>>('/circles/create', {
      nama_sirkel,
      userId,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal membuat sirkel');
    return res.data.data;
  },

  joinCircle: async (kode_join: string, userId: number): Promise<Circle> => {
    const res = await apiClient.post<ApiResponse<Circle>>('/circles/join', {
      kode_join,
      userId,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal bergabung ke sirkel');
    return res.data.data;
  },

  deleteCircle: async (circleId: number, userId: number): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/circles/${circleId}?userId=${userId}`, {
      data: { userId },
    });
    if (!res.data.success) throw new Error(res.data.message || 'Gagal menghapus sirkel');
  },

  updateCircle: async (
    circleId: number,
    userId: number,
    nama_sirkel: string
  ): Promise<Circle> => {
    const res = await apiClient.put<ApiResponse<Circle>>(`/circles/${circleId}`, {
      userId,
      nama_sirkel,
    });
    if (!res.data.data) throw new Error(res.data.message || 'Gagal memperbarui sirkel');
    return res.data.data;
  },

  removeMember: async (
    circleId: number,
    targetUserId: number,
    requesterId: number
  ): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/circles/${circleId}/members/${targetUserId}?requesterId=${requesterId}`,
      {
        data: { requesterId },
      }
    );
    if (!res.data.success) throw new Error(res.data.message || 'Gagal menghapus anggota');
  },
};
