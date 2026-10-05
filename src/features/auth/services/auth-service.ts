import axios from 'axios';
import apiClient from '../../../lib/api-client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

const MOCK_USER: User = {
  id: "usr-1",
  name: "Budi Santoso",
  email: "budi@tokoroti.com",
  role: "OWNER",
  avatar: "https://github.com/shadcn.png",
  phone: "0812-3456-7890",
  bio: "Pemilik Toko Roti Enak & Praktisi Kuliner UMKM",
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
      }
      // Offline fallback
      return {
        user: {
          ...MOCK_USER,
          email: credentials.email || MOCK_USER.email,
        },
        token: `mock-token-${Date.now()}`,
      };
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.message || "Gagal mendaftar. Silakan coba lagi.");
      }
      // Offline fallback
      return {
        user: {
          id: `usr-${Date.now()}`,
          name: credentials.name,
          email: credentials.email,
          role: "OWNER",
        },
        token: `mock-token-${Date.now()}`,
        active_store_id: `str-${Date.now()}`,
        store: {
          id: `str-${Date.now()}`,
          name: credentials.store?.name || "Toko Utama",
        },
      };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network error on logout
    }
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.get<AuthResponse>('/auth/me');
      return response.data;
    } catch {
      return {
        user: MOCK_USER,
        token: localStorage.getItem('token') || `mock-token-${Date.now()}`,
      };
    }
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<User>('/auth/profile', data);
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.message || "Gagal menyimpan profil.");
      }
      return { ...MOCK_USER, ...data };
    }
  },
};
