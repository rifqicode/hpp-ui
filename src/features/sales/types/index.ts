import type { Product } from '../../recipes/types';

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  quantity: number;
  priceAtSale: number;
  costAtSale: number; // HPP per unit at the time of sale
  subtotal: number;
  totalCost: number; // costAtSale * quantity
  grossProfit: number; // subtotal - totalCost
}

export interface Sale {
  id: string;
  storeId: string;
  invoiceNumber: string;
  customerName?: string;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPct: number;
  discountAmount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  cashChange?: number;
  paymentReference?: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
  status: SaleStatus;
  items: SaleItem[];
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
  customerName?: string;
  items: {
    productId: string;
    quantity: number;
    priceAtSale: number;
    costAtSale: number;
  }[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  paymentReference?: string;
  notes?: string;
}

export interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalHpp: number;
  totalGrossProfit: number;
  averageMarginPct: number;
}
