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
    return Promise.reject(error);
  }
);

export default apiClient;
