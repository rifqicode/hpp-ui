export interface POSModifierGroup {
  id: string;
  name: string;
  min_selection: number;
  max_selection: number;
  options: { id: string; name: string; price: string }[];
}

export interface POSPromotionLine {
  source_index: number;
  variant_id: string;
  name: string;
  quantity: string;
  normal_price: string;
  charged_price: string;
  discount_amount: string;
  subtotal: string;
  is_reward_item: boolean;
  modifier_option_ids: string[] | null;
  modifier_groups?: POSModifierGroup[];
}

export interface POSPromotion {
  id: string;
  name: string;
  description: string;
  promo_type: string;
  min_purchase_amount: string;
  is_customer_required: boolean;
  items: { item_role: string; required_quantity: string; reward_price: string; variant_id?: string | null; product_id?: string | null; category_id?: string | null }[];
  eligible: boolean;
  reason?: string;
  needs_configuration: boolean;
  discount_amount: string;
  gross_sales: string;
  net_sales: string;
  lines: POSPromotionLine[];
}

export interface PromotionPreviewRequest {
  promotion_id?: string;
  items: { variant_id: string; quantity: string; modifier_option_ids: string[] }[];
  customer_phone: string;
  reward_selections?: { variant_id: string; modifier_option_ids: string[] }[];
}
