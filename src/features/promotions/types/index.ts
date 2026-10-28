export type PromotionType = 'DIRECT_DISCOUNT' | 'BUY_X_GET_Y' | 'BUNDLE' | 'SPECIAL_PRICE';
export type CostBasis = '' | 'LATEST_HPP' | 'CURRENT_RECIPE';
export type HealthStatus = 'PROFITABLE' | 'LOW_MARGIN' | 'MARGIN_DEFICIT';

export interface PromotionItemInput {
  variant_id: string | null;
  product_id: string | null;
  category_id: string | null;
  item_role: 'TRIGGER' | 'REWARD';
  required_quantity: string;
  reward_price: string;
}

export interface BasketItem { variant_id: string; quantity: string }

export interface PromotionInput {
  name: string;
  code: string | null;
  description: string;
  promo_type: PromotionType;
  scope: 'BILL' | 'ITEM';
  cost_basis: CostBasis;
  discount_type: '' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: string;
  max_discount_amount: string;
  min_purchase_amount: string;
  bundle_price: string | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  promo_budget: string;
  is_multiplier_allowed: boolean;
  max_reward_per_transaction: number;
  is_customer_required: boolean;
  applicable_channels: ('POS' | 'ONLINE')[];
  allow_stacking: false;
  items: PromotionItemInput[];
  simulation_items: BasketItem[];
  loss_leader_confirmed: boolean;
  version: number;
}

export interface SimulationLine {
  variant_id: string;
  name: string;
  quantity: string;
  normal_price: string;
  charged_price: string;
  discount_amount: string;
  subtotal: string;
  total_cost: string;
  gross_profit: string;
  is_reward_item: boolean;
}

export interface PromotionSimulation {
  cost_basis_used: Exclude<CostBasis, ''>;
  unit_economics: {
    gross_sales: string;
    promo_discount: string;
    net_sales: string;
    total_cogs: string;
    gross_profit: string;
    margin_pct: string | null;
  };
  budget_analysis: {
    total_budget: string;
    discount_per_trx: string;
    recommended_usage_limit: number;
    projected_gross_profit: string;
    projected_total_loss: string;
  };
  health_status: HealthStatus;
  is_loss_leader: boolean;
  prescriptive_advice: { type: string; title: string; message: string }[];
  lines: SimulationLine[];
}

export interface Promotion extends PromotionInput {
  id: string;
  store_id: string;
  usage_limit: number;
  usage_count: number;
  budget_spent: string;
  estimated_discount: string;
  planning_snapshot: PromotionSimulation | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionList {
  data: Promotion[];
  total: number;
  page: number;
  per_page: number;
  active_count: number;
  max_active_promotions: number;
}

export interface PromotionOption {
  id: string;
  name: string;
  product_id: string;
  product_name: string;
  category_id: string;
  category_name: string;
  selling_price: string;
}

export interface PromotionOptions { data: PromotionOption[]; total: number; page: number; per_page: number }
export interface PromotionEditor { id?: string; input: PromotionInput; readOnly: boolean; snapshot?: PromotionSimulation | null }
export type PendingPromotionAction =
  | { kind: 'save'; id?: string; input: PromotionInput; simulation: PromotionSimulation }
  | { kind: 'activate'; promotion: Promotion; simulation: PromotionSimulation };
