import apiClient from '../../../lib/api-client';
import { recipeService } from '../../recipes/services/recipe-service';
import type { Product } from '../../recipes/types';
import type {
  Sale,
  CreateSaleInput,
  SalesSummary,
  SaleQuery,
  PaginatedSales,
} from '../types';

export function normalizeSale(raw: any): Sale {
  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        id: it.id,
        saleId: it.sale_id ?? it.saleId ?? raw.id,
        sale_id: it.sale_id ?? it.saleId ?? raw.id,
        productId: it.product_id ?? it.productId ?? it.product?.id,
        product_id: it.product_id ?? it.productId ?? it.product?.id,
        productName:
          it.product?.name ?? it.product_name ?? it.productName ?? 'Product',
        product_name:
          it.product?.name ?? it.product_name ?? it.productName ?? 'Product',
        category:
          it.product?.category?.name ??
          it.product?.category ??
          it.category ??
          'Uncategorized',
        unit: it.product?.unit ?? it.unit ?? 'pcs',
        quantity: Number(it.quantity ?? 0),
        priceAtSale: Number(it.price_at_sale ?? it.priceAtSale ?? 0),
        price_at_sale: Number(it.price_at_sale ?? it.priceAtSale ?? 0),
        costAtSale: Number(it.cost_at_sale ?? it.costAtSale ?? 0),
        cost_at_sale: Number(it.cost_at_sale ?? it.costAtSale ?? 0),
        subtotal: Number(it.subtotal ?? 0),
        totalCost: Number(it.total_cost ?? it.totalCost ?? 0),
        total_cost: Number(it.total_cost ?? it.totalCost ?? 0),
        grossProfit: Number(it.gross_profit ?? it.grossProfit ?? 0),
        gross_profit: Number(it.gross_profit ?? it.grossProfit ?? 0),
        product: it.product,
      }))
    : [];

  const totalAmount = Number(raw.total_amount ?? raw.totalAmount ?? 0);
  const totalCost = Number(raw.total_cost ?? raw.totalCost ?? 0);
  const grossProfit = Number(
    raw.gross_profit ?? raw.grossProfit ?? totalAmount - totalCost
  );
  const profitMarginPct = Number(
    raw.profit_margin_pct ??
      raw.profitMarginPct ??
      (totalAmount > 0 ? (grossProfit / totalAmount) * 100 : 0)
  );
  const discountAmount = Number(raw.discount_amount ?? raw.discountAmount ?? 0);
  const taxAmount = Number(raw.tax_amount ?? raw.taxAmount ?? 0);
  const cashReceived =
    raw.cash_received != null || raw.cashReceived != null
      ? Number(raw.cash_received ?? raw.cashReceived)
      : undefined;
  const cashChange =
    raw.cash_change != null || raw.cashChange != null
      ? Number(raw.cash_change ?? raw.cashChange)
      : undefined;

  return {
    id: raw.id,
    storeId: raw.store_id ?? raw.storeId ?? '',
    store_id: raw.store_id ?? raw.storeId ?? '',
    invoiceNumber: raw.invoice_number ?? raw.invoiceNumber ?? 'TRX-UNKNOWN',
    invoice_number: raw.invoice_number ?? raw.invoiceNumber ?? 'TRX-UNKNOWN',
    customerId: raw.customer_id ?? raw.customerId,
    customer_id: raw.customer_id ?? raw.customerId,
    customerName:
      raw.customer_name ?? raw.customerName ?? raw.customer?.name ?? 'Guest',
    customer_name:
      raw.customer_name ?? raw.customerName ?? raw.customer?.name ?? 'Guest',
    cashierId: raw.cashier_id ?? raw.cashierId,
    cashier_id: raw.cashier_id ?? raw.cashierId,
    cashierName: raw.cashier_name ?? raw.cashierName,
    cashier_name: raw.cashier_name ?? raw.cashierName,
    totalAmount,
    total_amount: totalAmount,
    totalCost,
    total_cost: totalCost,
    grossProfit,
    gross_profit: grossProfit,
    profitMarginPct: Number(profitMarginPct.toFixed(2)),
    profit_margin_pct: Number(profitMarginPct.toFixed(2)),
    discountAmount,
    discount_amount: discountAmount,
    taxAmount,
    tax_amount: taxAmount,
    paymentMethod: raw.payment_method ?? raw.paymentMethod ?? 'CASH',
    payment_method: raw.payment_method ?? raw.paymentMethod ?? 'CASH',
    cashReceived,
    cash_received: cashReceived,
    cashChange,
    cash_change: cashChange,
    paymentReference: raw.payment_reference ?? raw.paymentReference,
    payment_reference: raw.payment_reference ?? raw.paymentReference,
    notes: raw.notes,
    transactionDate:
      raw.transaction_date ?? raw.transactionDate ?? new Date().toISOString(),
    transaction_date:
      raw.transaction_date ?? raw.transactionDate ?? new Date().toISOString(),
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    status: raw.status ?? 'COMPLETED',
    items,
    customer: raw.customer,
  };
}

export const salesService = {
  getProducts: async (): Promise<Product[]> => {
    return recipeService.getProducts();
  },

  getSales: async (query?: SaleQuery): Promise<Sale[]> => {
    const res = await apiClient.get<any>('/sales', { params: query });
    const rawList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];
    return rawList.map(normalizeSale);
  },

  getPaginatedSales: async (query?: SaleQuery): Promise<PaginatedSales> => {
    const res = await apiClient.get<any>('/sales', { params: query });
    if (res.data && Array.isArray(res.data.data)) {
      return {
        data: res.data.data.map(normalizeSale),
        total: res.data.total ?? res.data.data.length,
        page: res.data.page ?? 1,
        per_page: res.data.per_page ?? 10,
        total_pages: res.data.total_pages ?? 1,
      };
    }
    const list = Array.isArray(res.data) ? res.data.map(normalizeSale) : [];
    return {
      data: list,
      total: list.length,
      page: 1,
      per_page: list.length || 10,
      total_pages: 1,
    };
  },

  getSaleById: async (id: string): Promise<Sale> => {
    const res = await apiClient.get<any>(`/sales/${id}`);
    return normalizeSale(res.data);
  },

  createSale: async (input: CreateSaleInput): Promise<Sale> => {
    const payload = {
      customer_phone: input.customerPhone || input.customer_phone || undefined,
      customer_name: input.customerName || input.customer_name || undefined,
      items: input.items.map((it) => ({
        product_id: it.productId || it.product_id,
        quantity: it.quantity,
      })),
      discount_amount: input.discountAmount || input.discount_amount || 0,
      tax_amount: input.taxAmount || input.tax_amount || 0,
      payment_method: input.paymentMethod || input.payment_method || 'CASH',
      cash_received:
        input.cashReceived != null
          ? input.cashReceived
          : input.cash_received != null
          ? input.cash_received
          : undefined,
      payment_reference:
        input.paymentReference || input.payment_reference || undefined,
      notes: input.notes,
    };

    const res = await apiClient.post<any>('/sales', payload);
    return normalizeSale(res.data);
  },

  getSummary: async (query?: SaleQuery): Promise<SalesSummary> => {
    const res = await apiClient.get<any>('/sales/summary', { params: query });
    const raw = res.data || {};
    const totalRevenue = Number(raw.total_revenue ?? raw.totalRevenue ?? 0);
    const totalCost = Number(raw.total_cost ?? raw.totalCost ?? 0);
    const totalGrossProfit = Number(
      raw.total_gross_profit ?? raw.totalGrossProfit ?? 0
    );
    const averageMarginPct = Number(
      raw.average_margin_pct ?? raw.averageMarginPct ?? 0
    );
    const totalTransactions = Number(
      raw.total_transactions ?? raw.totalTransactions ?? 0
    );
    const averageOrderValue = Number(
      raw.average_order_value ?? raw.averageOrderValue ?? 0
    );

    return {
      totalRevenue,
      totalTransactions,
      totalHpp: totalCost,
      totalGrossProfit,
      averageMarginPct,
      averageOrderValue,
    };
  },
};
