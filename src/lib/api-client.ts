import axios from 'axios';
import { useAuthStore } from '../store/use-auth-store';
import { useLoadingStore } from '../store/use-loading-store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    useLoadingStore.getState().start();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeStoreId = useAuthStore.getState().activeStoreId;
    if (activeStoreId) {
      config.headers['X-Store-ID'] = activeStoreId;
    }
    return config;
  },
  (error) => {
    useLoadingStore.getState().stop();
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().stop();
    // Automatically unwrap standard backend envelope { success: true, message: "...", data: ... }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'success' in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error) => {
    useLoadingStore.getState().stop();
    const isUnauthorized = axios.isAxiosError(error) && error.response?.status === 401;
    const url = error.config?.url ?? '';
    const isAuthEndpoint = /\/auth\/(login|register|logout)/.test(url);

    if (isUnauthorized && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    }

    // Extract specific backend error message from standard { success, message, errors } envelope
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as {
        message?: string;
        error?: string;
        errors?: unknown;
      };
      let specificMsg = data.message || data.error;
      if (typeof data.errors === 'string' && data.errors.trim() !== '') {
        specificMsg = specificMsg ? `${specificMsg} (${data.errors})` : data.errors;
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        specificMsg = data.errors.join(', ');
      } else if (data.errors && typeof data.errors === 'object') {
        const vals = Object.values(data.errors).filter(Boolean);
        if (vals.length > 0) specificMsg = vals.join(', ');
      }

      if (specificMsg) {
        error.message = specificMsg;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
