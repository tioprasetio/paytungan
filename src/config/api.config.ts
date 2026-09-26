import { Platform } from 'react-native';
import { API_URL, SOCKET_URL as ENV_SOCKET_URL } from '@env';

// Fallback jika .env belum diatur
const getFallbackBaseUrl = (): string => {
  return Platform.select({
    android: 'http://10.0.2.2:4000/api',
    ios: 'http://localhost:4000/api',
    default: 'http://localhost:4000/api',
  }) || 'http://localhost:4000/api';
};

const getFallbackSocketUrl = (): string => {
  return Platform.select({
    android: 'http://10.0.2.2:4000',
    ios: 'http://localhost:4000',
    default: 'http://localhost:4000',
  }) || 'http://localhost:4000';
};

// API Base URL (digunakan oleh Axios)
export const API_BASE_URL: string = API_URL?.trim() || getFallbackBaseUrl();

// Socket Base URL (digunakan oleh Socket.io)
export const SOCKET_URL: string = ENV_SOCKET_URL?.trim() || getFallbackSocketUrl();

