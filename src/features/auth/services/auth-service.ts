import axios from 'axios';
import apiClient from '../../../lib/api-client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User, InviteDetailsResponse, AcceptInvitePayload } from '../types';

const NETWORK_ERROR_MSG = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";

function toError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const msg = err.response.data?.message;
      if (msg?.toLowerCase() === 'unauthorized' || err.response.status === 401) {
        return new Error("Email atau kata sandi salah. Silakan coba lagi.");
      }
      return new Error(msg || fallback);
    }
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

  checkUsername: async (username: string): Promise<{ username: string; available: boolean }> => {
    try {
      const response = await apiClient.get<{ username: string; available: boolean }>(
        `/auth/check-username?username=${encodeURIComponent(username)}`
      );
      return response.data;
    } catch {
      return { username, available: false };
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

  getInviteDetails: async (token: string): Promise<InviteDetailsResponse> => {
    try {
      const response = await apiClient.get<InviteDetailsResponse>(`/auth/invite?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Tautan undangan tidak valid atau telah kadaluarsa.");
    }
  },

  acceptInvite: async (payload: AcceptInvitePayload): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/invite/accept', payload);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Gagal menerima undangan.");
    }
  },
};

