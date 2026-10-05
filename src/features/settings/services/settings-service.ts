import apiClient from '../../../lib/api-client';
import { useAuthStore } from '../../../store/use-auth-store';
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
} from '../types';

let LOCAL_CURRENT_STORE: StoreInfo = {
  id: "store-1",
  name: "Toko Roti Enak - Cabang Pusat",
  category: "Bakery & Pastry",
  location: "Jl. Senopati No. 45, Jakarta Selatan",
  phone: "0811-2233-4455",
  description: "Dapur produksi dan gerai utama penjualan roti artisan & pastry.",
  isMain: true,
  status: "online",
  createdAt: "2024-01-10T08:00:00Z",
};

let LOCAL_STORES: StoreInfo[] = [
  LOCAL_CURRENT_STORE,
  {
    id: "store-2",
    name: "Toko Roti Enak - Tebet",
    category: "Outlet / Retail",
    location: "Jl. Tebet Raya No. 18, Jakarta Selatan",
    phone: "0812-9988-7766",
    description: "Outlet cabang etalase penjualan takeaway.",
    isMain: false,
    status: "online",
    createdAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "store-3",
    name: "Dapur Produksi Utama",
    category: "Central Kitchen / Manufaktur",
    location: "Kawasan Industri MM2100, Bekasi",
    phone: "0813-5566-7788",
    description: "Pusat pengolahan adonan mentah dan gudang bahan baku terpusat.",
    isMain: false,
    status: "offline",
    createdAt: "2024-04-15T09:00:00Z",
  },
];



let LOCAL_TELEGRAM: TelegramIntegrationState = {
  connected: false,
  telegramUsername: undefined,
  chatId: undefined,
  linkingCode: undefined,
  codeExpiresAt: undefined,
  allowPurchasesViaBot: true,
  allowSalesViaBot: true,
  dailyReportAlert: true,
};

let LOCAL_USER: UserProfileInfo = {
  id: "user-1",
  name: "Budi Santoso",
  email: "budi@tokoroti.com",
  emailVerified: true,
  avatar: "https://github.com/shadcn.png",
  plan: "Ultimate Pro",
};

let LOCAL_PREFERENCES: SystemPreferences = {
  lowStockThresholdDays: 3,
  currency: "IDR",
  timezone: "Asia/Jakarta (WIB)",
  autoBatchFifoDeduction: true,
};

export const settingsService = {
  // Store Operations
  getStoreProfile: async (storeId?: string): Promise<StoreInfo> => {
    let targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) {
      const stores = await settingsService.getStoresList();
      if (stores && stores.length > 0) {
        targetId = stores[0].id;
        useAuthStore.getState().setActiveStoreId(targetId);
      }
    }
    if (!targetId) {
      return { ...LOCAL_CURRENT_STORE };
    }
    try {
      const res = await apiClient.get<StoreInfo>(`/stores/${targetId}`);
      return res.data;
    } catch {
      return { ...LOCAL_CURRENT_STORE };
    }
  },

  updateStoreProfile: async (data: Partial<StoreInfo>, storeId?: string): Promise<StoreInfo> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error("Store ID tidak ditemukan");
    try {
      const res = await apiClient.put<StoreInfo>(`/stores/${targetId}`, data);
      return res.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Gagal memperbarui profil toko';
      throw new Error(message);
    }
  },

  getStoresList: async (): Promise<StoreInfo[]> => {
    try {
      const res = await apiClient.get<StoreInfo[]>('/stores');
      return res.data || [];
    } catch {
      return [];
    }
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
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Gagal membuat toko';
      throw new Error(message);
    }
  },

  switchStore: async (storeId: string): Promise<StoreInfo> => {
    try {
      const res = await apiClient.post<StoreInfo>('/stores/switch', { store_id: storeId });
      return res.data;
    } catch {
      const found = LOCAL_STORES.find((s) => s.id === storeId);
      if (found) {
        LOCAL_CURRENT_STORE = { ...found };
      }
      return { ...LOCAL_CURRENT_STORE };
    }
  },

  // Staff Operations
  getStaffList: async (storeId?: string): Promise<StaffMember[]> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) return [];
    try {
      const res = await apiClient.get<StaffMember[]>(`/stores/${targetId}/staff`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  inviteStaff: async (input: InviteStaffInput, storeId?: string): Promise<StaffMember> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error("Store ID tidak ditemukan");
    try {
      const res = await apiClient.post<StaffMember>(`/stores/${targetId}/staff`, input);
      return res.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Gagal mengundang staf';
      throw new Error(message);
    }
  },

  revokeStaff: async (staffId: string, storeId?: string): Promise<void> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error("Store ID tidak ditemukan");
    try {
      await apiClient.delete(`/stores/${targetId}/staff/${staffId}`);
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Gagal mencabut akses staf';
      throw new Error(message);
    }
  },

  // Telegram AI Integration
  getTelegramStatus: async (): Promise<TelegramIntegrationState> => {
    try {
      const res = await apiClient.get<TelegramIntegrationState>('/integrations/me');
      return res.data;
    } catch {
      return { ...LOCAL_TELEGRAM };
    }
  },

  generateTelegramCode: async (): Promise<{ code: string; expiresAt: string }> => {
    try {
      const res = await apiClient.post<{ code: string; expires_at: string }>('/integrations/link');
      return { code: res.data.code, expiresAt: res.data.expires_at };
    } catch {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      LOCAL_TELEGRAM = {
        ...LOCAL_TELEGRAM,
        linkingCode: code,
        codeExpiresAt: expiresAt,
      };
      return { code, expiresAt };
    }
  },

  connectTelegramMock: async (username: string): Promise<TelegramIntegrationState> => {
    LOCAL_TELEGRAM = {
      ...LOCAL_TELEGRAM,
      connected: true,
      telegramUsername: username.startsWith('@') ? username : `@${username}`,
      chatId: "982341029",
      linkingCode: undefined,
      codeExpiresAt: undefined,
    };
    return { ...LOCAL_TELEGRAM };
  },

  disconnectTelegram: async (): Promise<TelegramIntegrationState> => {
    try {
      await apiClient.post('/integrations/telegram/disconnect');
    } catch {
      // ignore
    }
    LOCAL_TELEGRAM = {
      ...LOCAL_TELEGRAM,
      connected: false,
      telegramUsername: undefined,
      chatId: undefined,
      linkingCode: undefined,
    };
    return { ...LOCAL_TELEGRAM };
  },

  updateTelegramPreferences: async (prefs: Partial<TelegramIntegrationState>): Promise<TelegramIntegrationState> => {
    try {
      const res = await apiClient.put<TelegramIntegrationState>('/integrations/telegram/preferences', prefs);
      return res.data;
    } catch {
      LOCAL_TELEGRAM = { ...LOCAL_TELEGRAM, ...prefs };
      return { ...LOCAL_TELEGRAM };
    }
  },

  // User Profile
  getUserProfile: async (): Promise<UserProfileInfo> => {
    try {
      const res = await apiClient.get<UserProfileInfo>('/auth/me');
      return res.data;
    } catch {
      return { ...LOCAL_USER };
    }
  },

  updateUserProfile: async (data: Partial<UserProfileInfo>): Promise<UserProfileInfo> => {
    try {
      const res = await apiClient.put<UserProfileInfo>('/auth/profile', data);
      return res.data;
    } catch {
      LOCAL_USER = { ...LOCAL_USER, ...data };
      return { ...LOCAL_USER };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Sessions Management
  getSessions: async (): Promise<DeviceSession[]> => {
    try {
      const res = await apiClient.get<DeviceSession[]>('/auth/sessions');
      return res.data;
    } catch {
      return [];
    }
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  revokeOtherSessions: async (): Promise<void> => {
    await apiClient.delete('/auth/sessions/others');
  },

  // System Preferences
  getPreferences: async (storeId?: string): Promise<SystemPreferences> => {
    let targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) {
      const stores = await settingsService.getStoresList();
      if (stores && stores.length > 0) {
        targetId = stores[0].id;
        useAuthStore.getState().setActiveStoreId(targetId);
      }
    }
    if (!targetId) return { ...LOCAL_PREFERENCES };
    try {
      const res = await apiClient.get<SystemPreferences>(`/stores/${targetId}/preferences`);
      return res.data;
    } catch {
      return { ...LOCAL_PREFERENCES };
    }
  },

  updatePreferences: async (data: Partial<SystemPreferences>, storeId?: string): Promise<SystemPreferences> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) throw new Error("Store ID tidak ditemukan");
    try {
      const res = await apiClient.put<SystemPreferences>(`/stores/${targetId}/preferences`, data);
      return res.data;
    } catch {
      LOCAL_PREFERENCES = { ...LOCAL_PREFERENCES, ...data };
      return { ...LOCAL_PREFERENCES };
    }
  },

  // Permissions & Roles
  getStorePermissions: async (storeId?: string): Promise<{ permissions: string[]; role: string }> => {
    let targetId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetId) {
      const stores = await settingsService.getStoresList();
      if (stores && stores.length > 0) {
        targetId = stores[0].id;
        useAuthStore.getState().setActiveStoreId(targetId);
      }
    }
    if (!targetId) return { permissions: [], role: "" };
    try {
      const res = await apiClient.get<{ permissions: string[]; role: string }>(`/stores/${targetId}/permissions`);
      if (res.data?.permissions) {
        useAuthStore.getState().setPermissions(res.data.permissions);
      }
      return res.data;
    } catch {
      return { permissions: [], role: "" };
    }
  },

  getPermissionsCatalog: async (): Promise<Permission[]> => {
    try {
      const res = await apiClient.get<Permission[]>("/permissions");
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return DEFAULT_PERMISSIONS_CATALOG;
    } catch {
      return DEFAULT_PERMISSIONS_CATALOG;
    }
  },

  getRolesList: async (storeId?: string): Promise<Role[]> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    try {
      const url = targetId ? `/stores/${targetId}/roles` : "/roles";
      const res = await apiClient.get<Role[]>(url);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const normalized: Role[] = res.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName || r.display_name || r.name,
          storeId: r.storeId || r.store_id || null,
          description: r.description || "",
          isSystem: r.isSystem ?? r.is_system ?? false,
          permissions: (r.permissions && r.permissions.length > 0)
            ? r.permissions
            : (DEFAULT_SYSTEM_ROLES.find((sr) => sr.name === r.name)?.permissions || []),
        }));

        const existingNames = new Set(normalized.map((r) => r.name));
        const merged = [
          ...normalized,
          ...LOCAL_CUSTOM_ROLES.filter((lr) => !existingNames.has(lr.name)),
        ];
        return merged;
      }
      return [...DEFAULT_SYSTEM_ROLES, ...LOCAL_CUSTOM_ROLES];
    } catch {
      return [...DEFAULT_SYSTEM_ROLES, ...LOCAL_CUSTOM_ROLES];
    }
  },

  createRole: async (input: CreateRoleInput, storeId?: string): Promise<Role> => {
    const targetId = storeId || useAuthStore.getState().activeStoreId;
    const allPerms = await settingsService.getPermissionsCatalog();
    const assignedPerms = allPerms.filter((p) => input.permissionCodes.includes(p.code));

    const roleName = input.name.trim().toUpperCase().replace(/\s+/g, "_");
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleName,
      displayName: input.displayName.trim(),
      description: input.description?.trim() || "",
      isSystem: false,
      storeId: targetId || null,
      permissions: assignedPerms,
      createdAt: new Date().toISOString(),
    };

    if (targetId) {
      try {
        const res = await apiClient.post<any>(`/stores/${targetId}/roles`, {
          name: newRole.name,
          display_name: newRole.displayName,
          description: newRole.description,
          permission_codes: input.permissionCodes,
        });
        if (res.data) {
          const created: Role = {
            id: res.data.id || newRole.id,
            name: res.data.name || newRole.name,
            displayName: res.data.displayName || res.data.display_name || newRole.displayName,
            description: res.data.description || newRole.description,
            isSystem: false,
            storeId: targetId,
            permissions: (res.data.permissions && res.data.permissions.length > 0)
              ? res.data.permissions
              : assignedPerms,
            createdAt: res.data.createdAt || res.data.created_at || newRole.createdAt,
          };
          LOCAL_CUSTOM_ROLES.push(created);
          return created;
        }
      } catch (err: any) {
        console.warn("Backend create role failed, falling back to local storage:", err?.message);
      }
    }

    LOCAL_CUSTOM_ROLES.push(newRole);
    return newRole;
  },
};

const DEFAULT_PERMISSIONS_CATALOG: Permission[] = [
  // MENU
  { id: "p-m-1", code: "menu:dashboard", name: "Menu Dashboard Ringkasan", group: "MENU", description: "Melihat overview statistik bisnis dan ringkasan finansial toko" },
  { id: "p-m-2", code: "menu:stocks", name: "Menu Inventaris Stok", group: "MENU", description: "Melihat modul stok bahan baku dan batch log" },
  { id: "p-m-3", code: "menu:recipes", name: "Menu Resep & HPP", group: "MENU", description: "Melihat modul resep produksi dan kalkulasi biaya HPP" },
  { id: "p-m-4", code: "menu:products", name: "Menu Katalog Produk", group: "MENU", description: "Melihat modul produk siap jual dan penetapan harga margin" },
  { id: "p-m-5", code: "menu:pos", name: "Menu Kasir (POS)", group: "MENU", description: "Melihat antarmuka kasir penjualan" },
  { id: "p-m-6", code: "menu:staff", name: "Menu Anggota Tim", group: "MENU", description: "Melihat daftar tim dan hak akses cabang" },
  { id: "p-m-7", code: "menu:settings", name: "Menu Pengaturan Toko", group: "MENU", description: "Melihat pengaturan outlet dan konfigurasi" },
  { id: "p-m-8", code: "menu:reports", name: "Menu Laporan Keuangan", group: "MENU", description: "Melihat laporan penjualan, HPP, dan analisis laba kotor" },

  // STOCKS
  { id: "p-s-1", code: "stocks:read", name: "Melihat Daftar Stok", group: "STOCKS", description: "Melihat rincian bahan baku dan sisa stok" },
  { id: "p-s-2", code: "stocks:create", name: "Menambah Bahan Baku", group: "STOCKS", description: "Mendaftarkan bahan baku baru ke toko" },
  { id: "p-s-3", code: "stocks:update", name: "Mengubah Bahan Baku", group: "STOCKS", description: "Mengubah harga beli, unit satuan, dan ambang batas stok" },
  { id: "p-s-4", code: "stocks:adjust", name: "Penyesuaian Stok (Opname)", group: "STOCKS", description: "Melakukan stock opname atau penyesuaian fisik bahan" },
  { id: "p-s-5", code: "stocks:delete", name: "Menghapus Bahan Baku", group: "STOCKS", description: "Menghapus data bahan baku dari toko" },

  // RECIPES
  { id: "p-r-1", code: "recipes:read", name: "Melihat Resep & HPP", group: "RECIPES", description: "Melihat formula bahan dan rincian harga pokok produksi" },
  { id: "p-r-2", code: "recipes:create", name: "Membuat Formula Resep", group: "RECIPES", description: "Menambahkan formula komposisi bahan baru" },
  { id: "p-r-3", code: "recipes:update", name: "Mengubah Resep & Target Margin", group: "RECIPES", description: "Memperbarui formula dan target margin laba" },
  { id: "p-r-4", code: "recipes:delete", name: "Menghapus Resep", group: "RECIPES", description: "Menghapus formula resep" },

  // PRODUCTS
  { id: "p-p-1", code: "products:read", name: "Melihat Produk Siap Jual", group: "PRODUCTS", description: "Melihat daftar produk dan harga katalog" },
  { id: "p-p-2", code: "products:write", name: "Menambah / Mengubah Produk", group: "PRODUCTS", description: "Menyimpan dan mengedit produk siap jual" },
  { id: "p-p-3", code: "products:delete", name: "Menghapus Produk", group: "PRODUCTS", description: "Menghapus produk dari katalog toko" },

  // SALES
  { id: "p-sl-1", code: "orders:create", name: "Mencatat Transaksi Penjualan", group: "SALES", description: "Membuat order baru di kasir POS" },
  { id: "p-sl-2", code: "orders:read", name: "Melihat Riwayat Penjualan", group: "SALES", description: "Melihat transaksi dan struk pesanan" },
  { id: "p-sl-3", code: "orders:void", name: "Membatalkan Transaksi (Void)", group: "SALES", description: "Membatalkan transaksi penjualan yang telah selesai" },

  // STAFF
  { id: "p-st-1", code: "staff:manage", name: "Mengelola Anggota Staf", group: "STAFF", description: "Mengundang, mencabut, dan mengubah role staf toko" },

  // SETTINGS
  { id: "p-se-1", code: "settings:update", name: "Mengubah Pengaturan Toko", group: "SETTINGS", description: "Mengubah identitas toko, lokasi, dan preferensi perhitungan" },
];

const DEFAULT_SYSTEM_ROLES: Role[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    name: "STORE_OWNER",
    displayName: "Pemilik Toko (Owner)",
    description: "Akses penuh ke seluruh modul, keuangan, staf, dan pengaturan toko.",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS_CATALOG,
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    name: "STORE_MANAGER",
    displayName: "Manajer Operasional",
    description: "Mengelola stok bahan, resep, harga produk, laporan, dan operasional harian.",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS_CATALOG.filter((p) =>
      ["menu:dashboard", "menu:stocks", "menu:recipes", "menu:products", "menu:pos", "menu:reports", "stocks:read", "stocks:create", "stocks:update", "stocks:adjust", "recipes:read", "recipes:create", "recipes:update", "products:read", "products:write", "orders:create", "orders:read"].includes(p.code)
    ),
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    name: "STORE_CASHIER",
    displayName: "Kasir (POS)",
    description: "Akses khusus pencatatan transaksi penjualan kasir dan katalog produk siap jual.",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS_CATALOG.filter((p) =>
      ["menu:pos", "menu:products", "orders:create", "orders:read", "products:read"].includes(p.code)
    ),
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    name: "STORE_KITCHEN",
    displayName: "Tim Dapur & Produksi",
    description: "Akses khusus inventaris stok bahan baku dan panduan formula resep.",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS_CATALOG.filter((p) =>
      ["menu:stocks", "menu:recipes", "stocks:read", "stocks:adjust", "recipes:read"].includes(p.code)
    ),
  },
];

let LOCAL_CUSTOM_ROLES: Role[] = [];
