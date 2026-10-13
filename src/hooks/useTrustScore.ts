import { useState, useCallback, useEffect } from 'react';
import { trustScoreApi } from '../api/trustScore.api';
import { UserTrustScore } from '../types';

export const useTrustScore = (userId?: number, circleId?: number) => {
  const [trustScore, setTrustScore] = useState<UserTrustScore | null>(null);
  const [circleTrustScores, setCircleTrustScores] = useState<Record<number, UserTrustScore>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (userId) {
        const data = await trustScoreApi.getUserTrustScore(userId);
        setTrustScore(data);
      }
      if (circleId) {
        const circleData = await trustScoreApi.getCircleMembersTrustScores(circleId);
        setCircleTrustScores(circleData);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat trust score');
    } finally {
      setIsLoading(false);
    }
  }, [userId, circleId]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    trustScore,
    circleTrustScores,
    isLoading,
    error,
    refresh: fetchScore,
  };
};
