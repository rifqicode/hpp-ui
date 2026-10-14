export type SubscriptionTier = 'FREE' | 'GROWTH' | 'MAX_GROWTH';
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
  invoice_number: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  payment_method: string;
  billing_period_start: string;
  billing_period_end: string;
  paid_at: string;
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
  type: 'SUBSCRIPTION_EXPIRING_SOON' | 'SUBSCRIPTION_IN_GRACE_PERIOD' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_RENEWED';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
