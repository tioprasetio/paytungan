import { apiClient } from './apiClient';
import { UserTrustScore, ApiResponse } from '../types';

export const trustScoreApi = {
  getUserTrustScore: async (userId: number): Promise<UserTrustScore> => {
    const res = await apiClient.get<ApiResponse<UserTrustScore>>(`/trust-score/${userId}`);
    if (!res.data.data) throw new Error(res.data.message || 'Gagal memuat trust score');
    return res.data.data;
  },

  getCircleMembersTrustScores: async (
    circleId: number
  ): Promise<Record<number, UserTrustScore>> => {
    const res = await apiClient.get<ApiResponse<Record<number, UserTrustScore>>>(
      `/trust-score/circle/${circleId}`
    );
    return res.data.data || {};
  },
};
