import axios from 'axios';
import apiClient from '../../../lib/api-client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

const NETWORK_ERROR_MSG = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";

function toError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    if (err.response) return new Error(err.response.data?.message || fallback);
    return new Error(NETWORK_ERROR_MSG);
  }
  return err instanceof Error ? err : new Error(fallback);
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Gagal mendaftar. Silakan coba lagi.");
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
    } catch (err: unknown) {
      throw toError(err, "Gagal memuat data pengguna.");
    }
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<User>('/auth/profile', data);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Gagal menyimpan profil.");
    }
  },
};
