import type { ProductVariantView, ModifierOption } from '../../recipes/types';

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'EDC';
export type SaleStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING_CONFIRMATION' | 'CANCELLED' | 'RETURNED';
export type OrderSource = 'POS' | 'ONLINE' | string;
export type OrderFulfillmentType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | string;

export interface Customer {
  id: string;
  store_id?: string;
  storeId?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_orders: number;
  totalOrders?: number;
  total_spent: number;
  totalSpent?: number;
  last_order_at?: string;
  lastOrderAt?: string;
  notes?: string;
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CustomerDetail {
  customer: Customer;
  sales: Sale[];
}

export interface SaleItem {
	 isRewardItem?: boolean;
	 isFreeReward?: boolean;
	 discountAmount?: number;
	 promotionId?: string;
 variantId: string;
 variantName: string;
 costStatus: 'ESTIMATED'|'ACTUAL';
 modifiers: {id:string;name:string;price:number;cost:number;totalCost:number}[];
  returnedQuantity?: number;
  id: string;
  saleId: string;
  sale_id?: string;
  productId: string;
  product_id?: string;
  productName: string;
  product_name?: string;
  category: string;
  unit: string;
  quantity: number;
  priceAtSale: number;
  price_at_sale?: number;
  costAtSale: number; // HPP per unit at the time of sale
  cost_at_sale?: number;
  subtotal: number;
  totalCost: number; // costAtSale * quantity
  total_cost?: number;
  grossProfit: number; // subtotal - totalCost
  gross_profit?: number;
  productionLogId?: string;
  production_log_id?: string;
  product?: {
    id: string;
    name: string;
    category?: string;
    unit?: string;
  };
}

export interface Sale {
	 promotionId?: string;
	 promotions?: { promo_name: string; promo_type: string; discount_amount: string; gross_sales: string; net_sales: string; total_cost: string; gross_profit: string; cost_status: string }[];
 originalTotalAmount?: number;
 refundedAmount?: number;
 restoredCost?: number;
 corrections?: SaleCorrection[];

  id: string;
  storeId?: string;
  store_id?: string;
  invoiceNumber: string;
  invoice_number?: string;
  customerId?: string;
  customer_id?: string;
  customerName?: string;
  customer_name?: string;
  cashierId?: string;
  cashier_id?: string;
  cashierName?: string;
  cashier_name?: string;
  totalAmount: number;
  total_amount?: number;
  totalCost: number;
  total_cost?: number;
  grossProfit: number;
  gross_profit?: number;
  profitMarginPct: number;
  profit_margin_pct?: number;
  discountAmount: number;
  discount_amount?: number;
  taxAmount: number;
  tax_amount?: number;
  paymentMethod: PaymentMethod;
  payment_method?: PaymentMethod;
  cashReceived?: number;
  cash_received?: number;
  cashChange?: number;
  cash_change?: number;
  paymentReference?: string;
  payment_reference?: string;
  edcIssuerBank?: string;
  edc_issuer_bank?: string;
  notes?: string;
  internalNotes?: string;
  internal_notes?: string;
  transactionDate: string;
  transaction_date?: string;
  createdAt: string;
  created_at?: string;
  status: SaleStatus;
  orderSource?: OrderSource;
  order_source?: OrderSource;
  fulfillmentType?: OrderFulfillmentType;
  fulfillment_type?: OrderFulfillmentType;
  customerPhone?: string;
  customer_phone?: string;
  customerEmail?: string;
  customer_email?: string;
  tableNumber?: string;
  table_number?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  deliveryFee?: number;
  delivery_fee?: number;
  deliveryCourierName?: string;
  delivery_courier_name?: string;
  deliveryTrackingInfo?: string;
  delivery_tracking_info?: string;
  pickupTime?: string;
  pickup_time?: string;
  customFieldLabel?: string;
  custom_field_label?: string;
  customFieldValue?: string;
  custom_field_value?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  publicTrackingToken?: string;
  public_tracking_token?: string;
  productionLogId?: string;
  production_log_id?: string;
  productionLogs?: any[];
  production_logs?: any[];
  items: SaleItem[];
  customer?: Customer;
}

export interface CartItem {
 key: string;
 modifiers: ModifierOption[];
  product: ProductVariantView;
  quantity: number;
  price: number;
  cost: number;
  notes?: string;
}

export interface CreateSaleInput {
	 promotionId?: string;
	 rewardSelections?: { variant_id: string; modifier_option_ids: string[] }[];
  storeId?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerName?: string;
  customer_name?: string;
  fulfillmentType?: 'DINE_IN' | 'TAKE_AWAY' | string;
  fulfillment_type?: 'DINE_IN' | 'TAKE_AWAY' | string;
  tableNumber?: string;
  table_number?: string;
  items: {
    variantId: string;
    modifierOptionIds?: string[];
    quantity: number;
    priceAtSale?: number;
    costAtSale?: number;
  }[];
  discountAmount?: number;
  discount_amount?: number;
  taxAmount?: number;
  tax_amount?: number;
  paymentMethod: PaymentMethod;
  payment_method?: PaymentMethod;
  cashReceived?: number;
  cash_received?: number;
  paymentReference?: string;
  payment_reference?: string;
  edcIssuerBank?: string;
  edc_issuer_bank?: string;
  notes?: string;
  internalNotes?: string;
  internal_notes?: string;
}

export interface SaleQuery {
  status?: string;
  order_source?: string;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AcceptOnlineOrderInput {
  payment_method?: PaymentMethod;
  cash_received?: number;
  payment_reference?: string;
  delivery_fee?: number;
  mark_completed?: boolean;
}

export interface FulfillOnlineOrderInput {
  delivery_courier_name?: string;
  delivery_tracking_info?: string;
  delivery_fee?: number;
}

export interface RejectOnlineOrderInput {
  rejection_reason: string;
}

export interface PaginatedSales {
  data: Sale[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalHpp: number;
  totalGrossProfit: number;
  averageMarginPct: number;
  averageOrderValue?: number;
}

export interface CustomerSummary {
  total_customers: number;
  active_customers: number;
  total_spent_amount: string | number;
}

export interface SaleCorrection {
 id: string; actor_id: string; actor_name?: string; kind: string; reason: string; refund_method: string;
 refund_reference: string; refund_amount: string | number; created_at: string;
 items: { id: string; sale_item_id: string; quantity: string | number; restock: boolean }[];
}
export interface CorrectSaleInput {
 request_id: string; kind: 'CANCEL' | 'RETURN'; reason: string; refund_method: string;
 refund_reference?: string;
 items: { sale_item_id: string; quantity: number; restock: boolean }[];
}
