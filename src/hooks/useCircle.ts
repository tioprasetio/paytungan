import { useState, useCallback } from 'react';
import { circleApi } from '../api/circle.api';
import { Circle } from '../types';

export const useCircle = (userId?: number) => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [currentCircle, setCurrentCircle] = useState<Circle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCircles = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await circleApi.getUserCircles(userId);
      setCircles(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat sirkel');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchCircleById = useCallback(async (circleId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await circleApi.getCircleById(circleId);
      setCurrentCircle(data);
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail sirkel');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCircle = async (nama_sirkel: string) => {
    if (!userId) throw new Error('User belum login');
    const newCircle = await circleApi.createCircle(nama_sirkel, userId);
    await fetchUserCircles();
    return newCircle;
  };

  const joinCircle = async (kode_join: string) => {
    if (!userId) throw new Error('User belum login');
    const circle = await circleApi.joinCircle(kode_join, userId);
    await fetchUserCircles();
    return circle;
  };

  return {
    circles,
    currentCircle,
    isLoading,
    error,
    fetchUserCircles,
    fetchCircleById,
    createCircle,
    joinCircle,
  };
};
