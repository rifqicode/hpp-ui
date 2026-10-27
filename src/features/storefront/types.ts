import type { PaymentMethod, SaleStatus } from '../sales/types';

export type StorefrontTemplateStyle =
  | 'EXPRESS_MENU'
  | 'VISUAL_CATALOG'
  | 'PRE_ORDER_STORY';

export type StorefrontAccentColor =
  | 'default'
  | 'emerald'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'slate';

export type StorefrontSurfaceMode = 'light' | 'warm' | 'dark';
export type StorefrontBorderRadius = 'sharp' | 'rounded' | 'pill';
export type StorefrontCatalogLayout = 'grid' | 'list';
export type StorefrontHeroLayout =
  | 'SPLIT_SHOWCASE'
  | 'COVER_BANNER'
  | 'CENTERED_STORY';
export type StorefrontDeliveryFeeMode = 'FLAT_RATE' | 'COURIER_CONFIRMATION';
export type FulfillmentType = 'DINE_IN' | 'PICKUP' | 'DELIVERY';

export type StoreSectionId =
  | 'hero_banner'
  | 'announcement_bar'
  | 'info_and_contact'
  | 'product_catalog'
  | 'payment_and_order_info';

export type CheckoutSectionId =
  | 'order_summary'
  | 'fulfillment_method'
  | 'customer_identity'
  | 'custom_field_and_notes'
  | 'payment_showcase';

export interface StorefrontThemeConfig {
  accent_color: StorefrontAccentColor;
  surface_mode: StorefrontSurfaceMode;
  border_radius: StorefrontBorderRadius;
  catalog_layout: StorefrontCatalogLayout;
  hero_layout: StorefrontHeroLayout;
  show_hero_image: boolean;
  banner_url: string;
  logo_url: string;
}

export interface StorefrontSectionItem {
  id: string;
  enabled: boolean;
}

export interface StorefrontDeliveryConfig {
  delivery_fee_mode: StorefrontDeliveryFeeMode;
  flat_delivery_fee: number;
  free_delivery_min_order: number;
  delivery_instruction: string;
}

export interface StorefrontCheckoutConfig {
  allow_dine_in: boolean;
  allow_pickup: boolean;
  allow_delivery: boolean;
  show_email_field: boolean;
  require_email_field: boolean;
  show_notes_field: boolean;
  show_pickup_time: boolean;
  custom_field_enabled: boolean;
  custom_field_label: string;
  custom_field_placeholder: string;
  custom_field_required: boolean;
  delivery: StorefrontDeliveryConfig;
}

export interface StorefrontBankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}

export interface StorefrontPaymentConfig {
  enable_cash_on_cashier: boolean;
  cash_instruction: string;
  enable_qris: boolean;
  qris_image_url: string;
  qris_merchant_name: string;
  enable_bank_transfer: boolean;
  bank_accounts: StorefrontBankAccount[];
  payment_instruction: string;
}

export interface StorefrontContactConfig {
  whatsapp_number: string;
  show_floating_whatsapp: boolean;
  whatsapp_greeting: string;
  instagram_handle: string;
  operational_hours: string;
}

export interface StorefrontCopywritingConfig {
  brand_name: string;
  brand_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_highlights: string[];
  hero_primary_cta_text: string;
  hero_secondary_cta_text: string;
  announcement_text: string;
  checkout_title: string;
  checkout_subtitle: string;
  customer_section_title: string;
  notes_placeholder: string;
  submit_button_text: string;
  order_success_title: string;
  order_success_message: string;
}

export interface StorefrontConfig {
  template_style: StorefrontTemplateStyle;
  theme: StorefrontThemeConfig;
  store_sections: StorefrontSectionItem[];
  checkout_sections: StorefrontSectionItem[];
  checkout: StorefrontCheckoutConfig;
  payment: StorefrontPaymentConfig;
  contact: StorefrontContactConfig;
  copywriting: StorefrontCopywritingConfig;
}

export interface PublicModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface PublicModifierGroup {
  id: string;
  name: string;
  min_selection: number;
  max_selection: number;
  options: PublicModifierOption[];
}

export interface PublicProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  unit: string;
  selling_price: number;
  current_stock: number;
  is_default: boolean;
  is_active: boolean;
}

export interface PublicCatalogProduct {
  id: string;
  name: string;
  category: string;
  category_id?: string;
  mode: 'MAKE_TO_STOCK' | 'MAKE_TO_ORDER';
  image_url: string | null;
  description: string;
  variants: PublicProductVariant[];
  modifier_groups: PublicModifierGroup[];
}

export interface PublicStoreProfile {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  address?: string;
  phone: string;
  description: string;
  is_storefront_active: boolean;
  storefront_config: StorefrontConfig;
}

export interface PublicStorefrontResponse {
  store: PublicStoreProfile;
  categories: string[];
  products: PublicCatalogProduct[];
}

export interface StorefrontCartItem {
  key: string;
  productId: string;
  productName: string;
  productMode: 'MAKE_TO_STOCK' | 'MAKE_TO_ORDER';
  imageUrl: string | null;
  variantId: string;
  variantName: string;
  unit: string;
  basePrice: number;
  unitPrice: number;
  maxStock: number;
  quantity: number;
  modifiers: PublicModifierOption[];
}

export interface CreateOnlineOrderItemInput {
  variant_id: string;
  modifier_option_ids: string[];
  quantity: number;
}

export interface CreateOnlineOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  fulfillment_type: FulfillmentType;
  table_number?: string;
  delivery_address?: string;
  pickup_time?: string;
  custom_field_label?: string;
  custom_field_value?: string;
  payment_method: PaymentMethod;
  payment_reference?: string;
  notes?: string;
  items: CreateOnlineOrderItemInput[];
}

export interface PublicOrderTrackingItem {
  id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  unit: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
  modifiers: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface PublicOrderTrackingResponse {
  id: string;
  invoice_number: string;
  public_tracking_token: string;
  status: SaleStatus | 'PENDING_CONFIRMATION';
  order_source: string;
  fulfillment_type: FulfillmentType;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  table_number: string;
  delivery_address: string;
  delivery_fee: number;
  delivery_courier_name: string;
  delivery_tracking_info: string;
  pickup_time: string;
  custom_field_label: string;
  custom_field_value: string;
  payment_method: PaymentMethod;
  payment_reference: string;
  notes: string;
  rejection_reason: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  transaction_date: string;
  created_at: string;
  items: PublicOrderTrackingItem[];
  store: PublicStoreProfile;
}

export interface UpdateStorefrontSettingsPayload {
  slug: string;
  is_storefront_active: boolean;
  storefront_config: StorefrontConfig;
}
