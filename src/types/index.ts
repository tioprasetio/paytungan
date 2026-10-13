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

export interface PenitipHistoryItem {
  sessionId: number;
  lokasi: string;
  status: SessionStatus | string;
  waktu_tutup: string | null;
  createdAt: string;
  updatedAt: string;
  sirkel: {
    id: number;
    nama_sirkel: string;
    kode_join: string;
  };
  jastiper: {
    id: number;
    nama: string;
    no_whatsapp: string;
    nama_bank?: string | null;
    nomor_rekening?: string | null;
    atas_nama?: string | null;
  };
  items: Array<{
    id: number;
    nama_barang: string;
    catatan: string | null;
    harga_final: number | null;
    status_bayar: boolean;
    createdAt?: string;
  }>;
  tarif_jastip: number;
  total_harga_barang: number;
  total_bayar: number;
  is_all_paid: boolean;
  payment_proof?: PaymentProof | null;
}

export interface JastiperHistoryItem {
  sessionId: number;
  lokasi: string;
  status: SessionStatus | string;
  tarif_jastip: number;
  waktu_tutup: string | null;
  createdAt: string;
  updatedAt: string;
  sirkel: {
    id: number;
    nama_sirkel: string;
    kode_join: string;
  };
  total_orders: number;
  total_penitip: number;
  total_omset: number;
  total_pendapatan_jastip: number;
  grand_total: number;
  is_fully_settled: boolean;
  penitip_list: Array<{
    userId: number;
    nama: string;
    no_whatsapp: string;
    item_count: number;
    total_bayar: number;
    is_paid: boolean;
    payment_proof_status?: string | null;
  }>;
}

export interface UserHistoryResponse {
  role: 'penitip' | 'jastiper' | 'all';
  penitip?: PenitipHistoryItem[];
  jastiper?: JastiperHistoryItem[];
}

export interface AuthResult {
  user: User;
  token: string;
}

export type BountyStatus = 'OPEN' | 'TAKEN' | 'BOUGHT' | 'COMPLETED' | 'CANCELLED';

export interface Bounty {
  id: number;
  circleId: number;
  creatorId: number;
  runnerId?: number | null;
  judul: string;
  deskripsi?: string | null;
  imbalan_bounty: number;
  estimasi_harga?: number | null;
  harga_final?: number | null;
  lokasi_tujuan?: string | null;
  lokasi_beli?: string | null;
  bukti_struk?: string | null;
  bukti_bayar?: string | null;
  status_bayar: boolean;
  status: BountyStatus;
  creator?: User;
  runner?: User | null;
  circle?: Circle;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBountyPayload {
  circleId: number;
  creatorId: number;
  judul: string;
  deskripsi?: string;
  imbalan_bounty: number;
  estimasi_harga?: number;
  lokasi_tujuan?: string;
  lokasi_beli?: string;
}

export type BadgeLevel = 'MASTER' | 'EXCELLENT' | 'GOOD' | 'NEW' | 'WARNING';

export interface TrustBadge {
  title: string;
  level: BadgeLevel;
  color: string;
  badgeCode: string;
  description: string;
}

export interface UserTrustScore {
  userId: number;
  nama: string;
  no_whatsapp: string;
  buyerScore: number;
  runnerScore: number;
  overallScore: number;
  buyerBadge: TrustBadge;
  runnerBadge: TrustBadge;
  isNgaret: boolean;
  stats: {
    totalPesanan: number;
    pesananLunas: number;
    pesananPending: number;
    sesiDibuat: number;
    sesiSelesai: number;
    bountySelesai: number;
  };
}



