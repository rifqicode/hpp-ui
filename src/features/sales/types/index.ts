import type { Product } from '../../recipes/types';

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
export type SaleStatus = 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED' | 'RETURNED';

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
  notes?: string;
  transactionDate: string;
  transaction_date?: string;
  createdAt: string;
  created_at?: string;
  status: SaleStatus;
  productionLogId?: string;
  production_log_id?: string;
  productionLogs?: any[];
  production_logs?: any[];
  items: SaleItem[];
  customer?: Customer;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  cost: number;
  notes?: string;
}

export interface CreateSaleInput {
  storeId?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerName?: string;
  customer_name?: string;
  items: {
    productId?: string;
    product_id?: string;
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
  notes?: string;
}

export interface SaleQuery {
  status?: string;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
  search?: string;
  page?: number;
  per_page?: number;
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
