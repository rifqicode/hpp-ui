import apiClient from '../../../lib/api-client';
import { useAuthStore } from '../../../store/use-auth-store';
import { readPermissionCache, writePermissionCache } from '../../../lib/permission-cache';
import type {
  StoreInfo,
  StaffMember,
  InviteStaffInput,
  TelegramIntegrationState,
  UserProfileInfo,
  SystemPreferences,
  DeviceSession,
  Permission,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from '../types';

interface ApiErrorLike {
  message?: string;
  response?: { data?: { error?: string; message?: string } };
}

function toError(error: unknown, fallback: string): Error {
  const e = error as ApiErrorLike;
  return new Error(e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback);
}

interface RawRole {
  id: string;
  name: string;
  store_id?: string | null;
  description?: string;
  is_system?: boolean;
  permissions?: Permission[];
  created_at?: string;
}

function normalizeRole(r: RawRole): Role {
  return {
    id: r.id,
    name: r.name,
    storeId: r.store_id || null,
    description: r.description || '',
    is_system: r.is_system ?? (!r.store_id || r.name === 'STORE_OWNER' || r.name === 'OWNER'),
    permissions: r.permissions || [],
    createdAt: r.created_at,
  };
}

async function resolveStoreId(storeId?: string): Promise<string | null> {
  let targetId = storeId || useAuthStore.getState().activeStoreId;
  if (!targetId) {
    const stores = await settingsService.getStoresList();
    if (stores.length > 0) {
      targetId = stores[0].id;
      useAuthStore.getState().setActiveStoreId(targetId);
    }
  }
  return targetId || null;
}

export const settingsService = {
  // Store Operations
  getStoreProfile: async (storeId?: string): Promise<StoreInfo> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) throw new Error('Toko tidak ditemukan');
    const res = await apiClient.get<StoreInfo>(`/stores/${targetId}`);
    return res.data;
  },

  updateStoreProfile: async (data: Partial<StoreInfo>, storeId?: string): Promise<StoreInfo> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error('Store ID tidak ditemukan');
    try {
      const res = await apiClient.put<StoreInfo>(`/stores/${targetId}`, data);
      return res.data;
    } catch (error) {
      throw toError(error, 'Gagal memperbarui profil toko');
    }
  },

  getStoresList: async (): Promise<StoreInfo[]> => {
    const res = await apiClient.get<StoreInfo[]>('/stores');
    return res.data || [];
  },

  createStore: async (data: {
    name: string;
    category?: string;
    location?: string;
    address?: string;
    phone?: string;
    description?: string;
  }): Promise<StoreInfo> => {
    try {
      const res = await apiClient.post<StoreInfo>('/stores', data);
      return res.data;
    } catch (error) {
      throw toError(error, 'Gagal membuat toko');
    }
  },

  switchStore: async (storeId: string): Promise<StoreInfo> => {
    const res = await apiClient.post<StoreInfo>('/stores/switch', { store_id: storeId });
    return res.data;
  },

  // Staff Operations
  getStaffList: async (storeId?: string): Promise<StaffMember[]> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) return [];
    const res = await apiClient.get<StaffMember[]>(`/stores/${targetId}/staff`);
    return res.data || [];
  },

  inviteStaff: async (input: InviteStaffInput, storeId?: string): Promise<StaffMember> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error('Store ID tidak ditemukan');
    try {
      const res = await apiClient.post<StaffMember>(`/stores/${targetId}/staff/invite`, input);
      return res.data;
    } catch (error) {
      throw toError(error, 'Gagal mengundang staf');
    }
  },

  updateStaffRole: async (userId: string, roleId: string, storeId?: string): Promise<void> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error('Store ID tidak ditemukan');
    try {
      await apiClient.put(`/stores/${targetId}/staff/${userId}/role`, { role_id: roleId });
    } catch (error) {
      throw toError(error, 'Gagal mengubah peran staf');
    }
  },

  revokeStaff: async (staffId: string, storeId?: string): Promise<void> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error('Store ID tidak ditemukan');
    try {
      await apiClient.delete(`/stores/${targetId}/staff/${staffId}`);
    } catch (error) {
      throw toError(error, 'Gagal mencabut akses staf');
    }
  },

  // Telegram AI Integration
  getTelegramStatus: async (): Promise<TelegramIntegrationState> => {
    const res = await apiClient.get<TelegramIntegrationState>('/integrations/me');
    return res.data;
  },

  generateTelegramCode: async (): Promise<{ code: string; expiresAt: string }> => {
    const res = await apiClient.post<{ code: string; expires_at: string }>('/integrations/link');
    return { code: res.data.code, expiresAt: res.data.expires_at };
  },

  disconnectTelegram: async (): Promise<void> => {
    await apiClient.post('/integrations/telegram/disconnect');
  },

  updateTelegramPreferences: async (prefs: Partial<TelegramIntegrationState>): Promise<TelegramIntegrationState> => {
    const res = await apiClient.put<TelegramIntegrationState>('/integrations/telegram/preferences', prefs);
    return res.data;
  },

  // User Profile
  getUserProfile: async (): Promise<UserProfileInfo> => {
    const res = await apiClient.get<UserProfileInfo>('/auth/me');
    return res.data;
  },

  updateUserProfile: async (data: Partial<UserProfileInfo>): Promise<UserProfileInfo> => {
    const res = await apiClient.put<UserProfileInfo>('/auth/profile', data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Sessions Management
  getSessions: async (): Promise<DeviceSession[]> => {
    const res = await apiClient.get<DeviceSession[]>('/auth/sessions');
    return res.data || [];
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  revokeOtherSessions: async (): Promise<void> => {
    await apiClient.delete('/auth/sessions/others');
  },

  // System Preferences
  getPreferences: async (storeId?: string): Promise<SystemPreferences> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) throw new Error('Toko tidak ditemukan');
    const res = await apiClient.get<SystemPreferences>(`/stores/${targetId}/preferences`);
    return res.data;
  },

  updatePreferences: async (data: Partial<SystemPreferences>, storeId?: string): Promise<SystemPreferences> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error('Store ID tidak ditemukan');
    const res = await apiClient.put<SystemPreferences>(`/stores/${targetId}/preferences`, data);
    return res.data;
  },

  // Permissions & Roles
  getStorePermissions: async (storeId?: string, force = false): Promise<{ permissions: string[]; role: string }> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) return { permissions: [], role: '' };
    const userId = useAuthStore.getState().user?.id;
    if (userId && !force) {
      const cached = await readPermissionCache(userId, targetId);
      if (cached) {
        useAuthStore.getState().setPermissions(cached.permissions);
        return cached;
      }
    }
    const res = await apiClient.get<{ permissions: string[]; role: string }>(`/stores/${targetId}/permissions`);
    if (res.data?.permissions) {
      useAuthStore.getState().setPermissions(res.data.permissions);
      if (userId) await writePermissionCache(userId, targetId, res.data);
    }
    return res.data;
  },

  getPermissionsCatalog: async (storeId?: string): Promise<Permission[]> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) return [];
    const res = await apiClient.get<Permission[]>(`/stores/${targetId}/permissions/catalog`);
    return Array.isArray(res.data) ? res.data : [];
  },

  getRolesList: async (storeId?: string): Promise<Role[]> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) return [];
    
    const url = `/stores/${targetId}/roles`;
    const res = await apiClient.get<RawRole[]>(url);
    if (!Array.isArray(res.data)) return [];
    return res.data
      .map(normalizeRole)
      .filter((r) => !r.storeId || r.storeId === targetId);
  },

  getRoleById: async (roleId: string, storeId?: string): Promise<Role | null> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) return null;
    const url = `/stores/${targetId}/roles/${roleId}`;
    try {
      const res = await apiClient.get<RawRole>(url);
      if (res.data) return normalizeRole(res.data);
      return null;
    } catch {
      // Fallback: search in getRolesList
      const list = await settingsService.getRolesList(targetId);
      return list.find((r) => r.id === roleId) || null;
    }
  },

  createRole: async (input: CreateRoleInput, storeId?: string): Promise<Role> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) throw new Error('Pilih toko terlebih dahulu sebelum membuat peran.');

    const roleName = input.name.trim().toUpperCase().replace(/\s+/g, '_');
    try {
      const res = await apiClient.post<RawRole>(`/stores/${targetId}/roles`, {
        name: roleName,
        description: input.description?.trim() || '',
        permission_codes: input.permissionCodes,
      });
      return normalizeRole(res.data);
    } catch (error) {
      throw toError(error, 'Gagal menambahkan peran baru');
    }
  },

  updateRole: async (roleId: string, input: UpdateRoleInput, storeId?: string): Promise<Role> => {
    const targetId = await resolveStoreId(storeId);
    if (!targetId) throw new Error('Pilih toko terlebih dahulu.');

    try {
      const res = await apiClient.put<RawRole>(`/stores/${targetId}/roles/${roleId}`, {
        name: input.name.trim(),
        description: input.description?.trim() || '',
        permission_codes: input.permission_codes,
      });
      return normalizeRole(res.data);
    } catch (error) {
      throw toError(error, 'Gagal memperbarui peran');
    }
  },
};
