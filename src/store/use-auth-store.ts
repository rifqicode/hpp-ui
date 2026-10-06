import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../features/auth/types';
import { clearPermissionCache } from '../lib/permission-cache';

interface AuthState {
  user: User | null;
  token: string | null;
  activeStoreId: string | null;
  permissions: string[];
  setAuth: (user: User, token: string) => void;
  setActiveStoreId: (storeId: string | null) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeStoreId: null,
      permissions: [],
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      setActiveStoreId: (activeStoreId) => set({ activeStoreId }),
      setPermissions: (permissions) => set({ permissions }),
      logout: () => {
        localStorage.removeItem('token');
        clearPermissionCache();
        set({ user: null, token: null, activeStoreId: null, permissions: [] });
      },
    }),
    {
      name: 'auth-storage',
      partialize: ({ permissions: _permissions, ...rest }) => rest,
    }
  )
);
