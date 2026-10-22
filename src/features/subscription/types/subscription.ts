export type SubscriptionTier = 'FREE' | 'GROWTH' | 'MAX_GROWTH';

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  GROWTH: 'Growth',
  MAX_GROWTH: 'Max Growth',
};

export type SubscriptionStatus = 'ACTIVE' | 'IN_GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';

export interface QuotaItem {
  current: number;
  limit: number;
  remaining: number;
}

export interface SubscriptionQuotas {
  stocks: QuotaItem;
  products: QuotaItem;
  batches: QuotaItem;
  staff: QuotaItem;
  stores: QuotaItem;
  suppliers: QuotaItem;
  customers: QuotaItem;
}

export interface SubscriptionFeatures {
  export_reports: boolean;
  multi_role_customization: boolean;
  production_analytics: boolean;
  advanced_pos: boolean;
  ai_assistant: boolean;
}

export interface PlanLimits {
  max_stores: number;
  max_stocks: number;
  max_products: number;
  max_batches_per_mo: number;
  max_staff_per_store: number;
  max_suppliers: number;
  max_customers: number;
}

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  billing_period: string;
  description: string;
  limits: PlanLimits;
  features: SubscriptionFeatures;
}

export interface SubscriptionUsageData {
  owner_id: string;
  can_manage_billing: boolean;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  effective_tier: SubscriptionTier;
  is_in_grace_period: boolean;
  grace_period_until: string | null;
  current_period_end: string | null;
  quotas: SubscriptionQuotas;
  features: SubscriptionFeatures;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id?: string;
  user_id?: string;
  invoice_number: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'CHALLENGE' | 'CANCEL' | 'DENY';
  payment_method: string;
  billing_period_start: string;
  billing_period_end: string;
  paid_at?: string | null;
  snap_token?: string | null;
  snap_redirect_url?: string | null;
  metadata?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentChannelConfig {
  code: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
}

export interface PaymentInstructions {
  payment_method: string;
  bank?: string;
  va_number?: string;
  bill_key?: string;
  biller_code?: string;
  qr_url?: string;
  qr_string?: string;
  expires_at?: string;
}

export interface CheckoutResponseData {
  invoice: SubscriptionInvoice;
  instructions?: PaymentInstructions;
  snap_token?: string;
  snap_redirect_url?: string;
  client_key?: string;
  is_production: boolean;
}

export interface MidtransConfigData {
  client_key: string;
  is_production: boolean;
}

export interface SyncInvoiceStatusResponse {
  invoice: SubscriptionInvoice;
  changed: boolean;
  provider_checked: boolean;
  provider_status: string;
  checked_at: string | null;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string | null;
  grace_period_until: string | null;
}

export interface SubscribeResponseData {
  subscription: SubscriptionRecord;
  invoice: SubscriptionInvoice;
}

export interface SubscriptionNotification {
  id: string;
  user_id?: string;
  store_id?: string | null;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}
