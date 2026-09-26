export type SessionStatus = 'OPEN' | 'LOCKED' | 'COMPLETED';

export interface User {
  id: number;
  nama: string;
  no_whatsapp: string;
  nama_bank?: string | null;
  nomor_rekening?: string | null;
  atas_nama?: string | null;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Circle {
  id: number;
  nama_sirkel: string;
  kode_join: string;
  members?: CircleMember[];
  sessions?: JastipSession[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CircleMember {
  id: number;
  userId: number;
  circleId: number;
  role: string;
  user?: User;
}

export interface JastipSession {
  id: number;
  circleId: number;
  creatorId: number;
  lokasi: string;
  status: SessionStatus;
  tarif_jastip: number;
  waktu_tutup: string | null;
  creator?: User;
  circle?: Circle;
  items?: OrderItem[];
  payment_proofs?: PaymentProof[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  sessionId: number;
  userId: number;
  nama_barang: string;
  catatan?: string | null;
  harga_final?: number | null;
  status_bayar?: boolean;
  user?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentProof {
  id: number;
  sessionId: number;
  userId: number;
  bukti_url: string;
  catatan?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  alasan_tolak?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserBillDetail {
  userId: number;
  nama: string;
  no_whatsapp: string;
  items: Array<{
    id: number;
    nama_barang: string;
    catatan: string | null;
    harga_final: number;
    status_bayar: boolean;
  }>;
  total_harga_barang: number;
  tarif_jastip: number;
  total_bayar: number;
  is_all_paid: boolean;
  payment_proof?: PaymentProof | null;
}

export interface SplitBillRecapResponse {
  sessionId: number;
  lokasi: string;
  status: SessionStatus;
  tarif_jastip_per_user: number;
  buyer: {
    id: number;
    nama: string;
    no_whatsapp: string;
    nama_bank?: string | null;
    nomor_rekening?: string | null;
    atas_nama?: string | null;
  };
  recap_per_user: UserBillDetail[];
  grand_total: number;
  total_collected: number;
  total_pending: number;
  is_fully_settled: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

