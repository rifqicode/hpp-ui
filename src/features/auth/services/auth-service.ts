import axios from 'axios';
import apiClient from '../../../lib/api-client';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  InviteDetailsResponse,
  AcceptInvitePayload,
  ResetPasswordPayload,
  ValidateResetTokenResponse,
  ServiceAgreementDocument,
} from '../types';

const NETWORK_ERROR_MSG = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";

function toError(err: unknown, fallback: string): Error & { status?: number; response?: any } {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const msg = err.response.data?.message;
      let error: Error & { status?: number; response?: any };
      if (msg?.toLowerCase() === 'unauthorized' || err.response.status === 401) {
        error = new Error("Email, username, atau kata sandi salah. Silakan coba lagi.");
      } else {
        error = new Error(msg || fallback);
      }
      error.status = err.response.status;
      error.response = err.response;
      return error;
    }
    return new Error(NETWORK_ERROR_MSG);
  }
  return err instanceof Error ? err : new Error(fallback);
}

export const authService = {
  getServiceAgreement: async (): Promise<ServiceAgreementDocument> => {
    try {
      const response = await apiClient.get<ServiceAgreementDocument>('/auth/service-agreement', { skipLoading: true });
      const document = response.data;
      if (!document || typeof document.version !== 'string' || !document.version.trim() ||
        typeof document.title !== 'string' || !document.title.trim() ||
        typeof document.app_name !== 'string' || !document.app_name.trim() ||
        typeof document.closing_text !== 'string' || !document.closing_text.trim() ||
        !Array.isArray(document.sections) || !document.sections.length ||
        !document.sections.every(section => section && typeof section.title === 'string' && section.title.trim() &&
          Array.isArray(section.paragraphs) && section.paragraphs.length &&
          section.paragraphs.every(paragraph => typeof paragraph === 'string' && paragraph.trim()))) {
        throw new Error('Dokumen ketentuan belum tersedia. Silakan coba lagi.');
      }
      return document;
    } catch (err: unknown) {
      throw toError(err, 'Gagal memuat Ketentuan Layanan & Kebijakan Privasi.');
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Gagal masuk. Periksa kembali email atau username dan kata sandi Anda.");
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

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (err: unknown) {
      throw toError(err, "Gagal memproses permintaan reset kata sandi.");
    }
  },

  validateResetToken: async (token: string): Promise<ValidateResetTokenResponse> => {
    try {
      const response = await apiClient.get<ValidateResetTokenResponse>(
        `/auth/reset-password/validate?token=${encodeURIComponent(token)}`
      );
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Tautan reset kata sandi tidak valid atau telah kedaluwarsa.");
    }
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<void> => {
    try {
      await apiClient.post('/auth/reset-password', payload);
    } catch (err: unknown) {
      throw toError(err, "Gagal mengatur ulang kata sandi. Silakan coba lagi.");
    }
  },

  verifyEmail: async (payload: { email: string; code: string }): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/verify-email', payload);
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Gagal memverifikasi email. Pastikan kode verifikasi sesuai.");
    }
  },

  resendVerification: async (email: string): Promise<void> => {
    try {
      await apiClient.post('/auth/resend-verification', { email });
    } catch (err: unknown) {
      throw toError(err, "Gagal mengirim ulang kode verifikasi.");
    }
  },

  verifyDevice: async (challengeToken: string, code: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/verify-device', {
        challenge_token: challengeToken,
        code,
      });
      return response.data;
    } catch (err: unknown) {
      throw toError(err, "Kode verifikasi salah atau telah kedaluwarsa.");
    }
  },

  resendDeviceOTP: async (challengeToken: string): Promise<void> => {
    try {
      await apiClient.post('/auth/resend-device-otp', {
        challenge_token: challengeToken,
      });
    } catch (err: unknown) {
      throw toError(err, "Gagal mengirim ulang kode verifikasi.");
    }
  },
};

