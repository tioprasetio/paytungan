import { apiClient } from './apiClient';
import { User, ApiResponse, AuthResult } from '../types';
import axios from 'axios';

export const authApi = {
  register: async (nama: string, no_whatsapp: string, pin: string): Promise<AuthResult> => {
    try {
      const res = await apiClient.post<ApiResponse<any>>('/auth/register', {
        nama,
        no_whatsapp,
        pin,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Gagal mendaftar');
      }
      const data = res.data.data;
      const user: User = data.user || data;
      const token: string = data.token || '';
      return { user, token };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
        if (err.code === 'ECONNABORTED') throw new Error('Koneksi timeout. Pastikan server backend berjalan.');
        if (err.message === 'Network Error') {
          throw new Error('Gagal terhubung ke server backend di port 4000. Pastikan backend aktif.');
        }
      }
      throw err;
    }
  },

  login: async (no_whatsapp: string, pin: string): Promise<AuthResult> => {
    try {
      const res = await apiClient.post<ApiResponse<any>>('/auth/login', {
        no_whatsapp,
        pin,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Gagal masuk');
      }
      const data = res.data.data;
      const user: User = data.user || data;
      const token: string = data.token || '';
      return { user, token };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
        if (err.code === 'ECONNABORTED') throw new Error('Koneksi timeout. Pastikan server backend berjalan.');
        if (err.message === 'Network Error') {
          throw new Error('Gagal terhubung ke server backend di port 4000. Pastikan backend aktif.');
        }
      }
      throw err;
    }
  },

  loginOrRegister: async (nama: string, no_whatsapp: string, pin?: string): Promise<AuthResult> => {
    try {
      const res = await apiClient.post<ApiResponse<any>>('/auth/legacy-auth', {
        nama,
        no_whatsapp,
        pin,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Gagal masuk');
      }
      const data = res.data.data;
      const user: User = data.user || data;
      const token: string = data.token || '';
      return { user, token };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
        if (err.code === 'ECONNABORTED') throw new Error('Koneksi timeout. Pastikan server backend berjalan.');
        if (err.message === 'Network Error') {
          throw new Error('Gagal terhubung ke server backend di port 4000. Pastikan backend aktif.');
        }
      }
      throw err;
    }
  },

  updateProfile: async (userId: number, nama: string): Promise<User> => {
    try {
      const res = await apiClient.put<ApiResponse<User>>(`/auth/profile/${userId}`, {
        nama,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Gagal memperbarui profil');
      }
      return res.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  changePin: async (userId: number, oldPin: string, newPin: string): Promise<string> => {
    try {
      const res = await apiClient.put<ApiResponse<null>>(`/auth/pin/${userId}`, {
        oldPin,
        newPin,
      });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Gagal memperbarui PIN');
      }
      return res.data.message || 'PIN berhasil diperbarui';
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  updatePaymentInfo: async (
    userId: number,
    paymentInfo: { nama_bank: string; nomor_rekening: string; atas_nama: string }
  ): Promise<User> => {
    try {
      const res = await apiClient.put<ApiResponse<User>>(`/auth/payment-info/${userId}`, paymentInfo);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Gagal menyimpan informasi rekening');
      }
      return res.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  getProfile: async (userId: number): Promise<User> => {
    try {
      const res = await apiClient.get<ApiResponse<User>>(`/auth/profile/${userId}`);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Gagal mengambil profil');
      }
      return res.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },
};
