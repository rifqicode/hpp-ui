export interface ReceiptConfig {
  paper_size: '58mm' | '80mm';
  header_text?: string;
  footer_text?: string;
  show_logo?: boolean;
  show_cashier_name?: boolean;
  show_customer_phone?: boolean;
  show_notes?: boolean;
}

export interface StoreInfo {
  id: string;
  name: string;
  staff_login_code?: string;
  slug?: string;
  isStorefrontActive?: boolean;
  is_storefront_active?: boolean;
  storefrontConfig?: unknown;
  storefront_config?: unknown;
  receipt_config?: ReceiptConfig;
  receiptConfig?: ReceiptConfig;
  category: string;
  location: string;
  phone?: string;
  description?: string;
  isMain?: boolean;
  status: "online" | "offline";
  role?: "OWNER" | "STAFF" | string;
  createdAt?: string;
}

export type StaffRole = "OWNER" | "STAFF" | string;

export interface Permission {
  id: string;
  code: string;
  name: string;
  group: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Role {
  id: string;
  name: string;
  storeId?: string | null;
  description?: string;
  is_system?: boolean;
  permissions?: Permission[];
  createdAt?: string;
}

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissionCodes: string[];
}

export interface UpdateRoleInput {
  name: string;
  description?: string;
  permission_codes: string[];
}

export interface StaffMember {
  id: string;
  userId?: string;
  user_id?: string;
  name: string;
  email: string;
  username?: string;
  role: StaffRole;
  joinedAt?: string;
  joined_at?: string;
  status: "active" | "invited";
}

export interface InviteStaffInput {
  username: string;
  password: string;
  name: string;
  role_id: string;
}

export interface TelegramIntegrationState {
  connected: boolean;
  telegramUsername?: string;
  chatId?: string;
  linkingCode?: string;
  codeExpiresAt?: string;
  allowPurchasesViaBot: boolean;
  allowSalesViaBot: boolean;
  dailyReportAlert: boolean;
}

export interface UserProfileInfo {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatar?: string;
  plan: string;
}

export interface SystemPreferences {
  lowStockThresholdDays: number;
  currency: string;
  timezone: string;
  autoBatchFifoDeduction: boolean;
}

export interface DeviceSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  type: "desktop" | "mobile";
}

