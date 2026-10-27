import apiClient from '../../../lib/api-client';
import { recipeService } from '../../recipes/services/recipe-service';
import type { Product } from '../../recipes/types';
import type {
  Sale,
  CorrectSaleInput,
  CreateSaleInput,
  SalesSummary,
  SaleQuery,
  PaginatedSales,
  AcceptOnlineOrderInput,
  FulfillOnlineOrderInput,
  RejectOnlineOrderInput,
} from '../types';

export function normalizeSale(raw: any): Sale {
  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        id: it.id,
        returnedQuantity: Number(it.returned_quantity || 0),
        saleId: it.sale_id ?? it.saleId ?? raw.id,
        sale_id: it.sale_id ?? it.saleId ?? raw.id,
        variantId:it.variant_id,
        variantName:it.variant_name??it.variant?.variant_name??'',
        costStatus:it.cost_status??'ESTIMATED',
        modifiers:(it.modifiers??[]).map((m:{id:string;name:string;price:string|number;cost:string|number;total_cost:string|number})=>({id:m.id,name:m.name,price:Number(m.price),cost:Number(m.cost),totalCost:Number(m.total_cost)})),
        productionLogId:it.production_log_id,
        productId: it.variant?.product_id??'',
        product_id: it.variant?.product_id??'',
        productName:
          (it.product_name??it.variant?.product?.name??'Produk')+' - '+(it.variant_name??it.variant?.variant_name??'Varian'),
        product_name:
          (it.product_name??it.variant?.product?.name??'Produk')+' - '+(it.variant_name??it.variant?.variant_name??'Varian'),
        category:
          it.variant?.product?.category_model?.name ??
          it.variant?.product?.category ??
          it.category ??
          'Uncategorized',
        unit: it.unit??it.variant?.unit ?? it.unit ?? 'pcs',
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

  const originalTotalAmount = Number(raw.total_amount ?? raw.totalAmount ?? 0);
  const refundedAmount = Number(raw.refunded_amount || 0);
  const restoredCost = Number(raw.restored_cost || 0);
  const totalAmount = originalTotalAmount - refundedAmount;
  const totalCost = Number(raw.total_cost ?? raw.totalCost ?? 0) - restoredCost;
  const grossProfit = Number(
    (raw.gross_profit ?? raw.grossProfit ?? originalTotalAmount - Number(raw.total_cost ?? raw.totalCost ?? 0)) - refundedAmount + restoredCost
  );
  const profitMarginPct = totalAmount > 0 ? grossProfit / totalAmount * 100 : 0;
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
    originalTotalAmount, refundedAmount, restoredCost, corrections: raw.corrections || [],
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
    orderSource: raw.order_source ?? raw.orderSource ?? 'POS',
    order_source: raw.order_source ?? raw.orderSource ?? 'POS',
    fulfillmentType: raw.fulfillment_type ?? raw.fulfillmentType ?? 'DINE_IN',
    fulfillment_type: raw.fulfillment_type ?? raw.fulfillmentType ?? 'DINE_IN',
    customerPhone: raw.customer_phone ?? raw.customerPhone ?? raw.customer?.phone ?? '',
    customer_phone: raw.customer_phone ?? raw.customerPhone ?? raw.customer?.phone ?? '',
    customerEmail: raw.customer_email ?? raw.customerEmail ?? raw.customer?.email ?? '',
    customer_email: raw.customer_email ?? raw.customerEmail ?? raw.customer?.email ?? '',
    tableNumber: raw.table_number ?? raw.tableNumber ?? '',
    table_number: raw.table_number ?? raw.tableNumber ?? '',
    deliveryAddress: raw.delivery_address ?? raw.deliveryAddress ?? '',
    delivery_address: raw.delivery_address ?? raw.deliveryAddress ?? '',
    deliveryFee: Number(raw.delivery_fee ?? raw.deliveryFee ?? 0),
    delivery_fee: Number(raw.delivery_fee ?? raw.deliveryFee ?? 0),
    deliveryCourierName: raw.delivery_courier_name ?? raw.deliveryCourierName ?? '',
    delivery_courier_name: raw.delivery_courier_name ?? raw.deliveryCourierName ?? '',
    deliveryTrackingInfo: raw.delivery_tracking_info ?? raw.deliveryTrackingInfo ?? '',
    delivery_tracking_info: raw.delivery_tracking_info ?? raw.deliveryTrackingInfo ?? '',
    pickupTime: raw.pickup_time ?? raw.pickupTime ?? '',
    pickup_time: raw.pickup_time ?? raw.pickupTime ?? '',
    customFieldLabel: raw.custom_field_label ?? raw.customFieldLabel ?? '',
    custom_field_label: raw.custom_field_label ?? raw.customFieldLabel ?? '',
    customFieldValue: raw.custom_field_value ?? raw.customFieldValue ?? '',
    custom_field_value: raw.custom_field_value ?? raw.customFieldValue ?? '',
    rejectionReason: raw.rejection_reason ?? raw.rejectionReason ?? '',
    rejection_reason: raw.rejection_reason ?? raw.rejectionReason ?? '',
    publicTrackingToken: raw.public_tracking_token ?? raw.publicTrackingToken ?? '',
    public_tracking_token: raw.public_tracking_token ?? raw.publicTrackingToken ?? '',
    items,
    customer: raw.customer,
  };
}

export const salesService = {
  correctSale: async (id: string, input: CorrectSaleInput): Promise<Sale> => {
    const res = await apiClient.post(`/sales/${id}/corrections`, input);
    return normalizeSale(res.data);
  },
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
        variant_id: it.variantId,
 modifier_option_ids:it.modifierOptionIds??[],
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

  acceptOnlineOrder: async (
    saleId: string,
    payload?: AcceptOnlineOrderInput
  ): Promise<Sale> => {
    const res = await apiClient.post<any>(
      `/sales/${saleId}/accept-online`,
      payload || {}
    );
    return normalizeSale(res.data);
  },

  fulfillOnlineOrder: async (
    saleId: string,
    payload: FulfillOnlineOrderInput
  ): Promise<Sale> => {
    const res = await apiClient.post<any>(
      `/sales/${saleId}/fulfill-online`,
      payload
    );
    return normalizeSale(res.data);
  },

  rejectOnlineOrder: async (
    saleId: string,
    payload: RejectOnlineOrderInput
  ): Promise<Sale> => {
    const res = await apiClient.post<any>(
      `/sales/${saleId}/reject-online`,
      payload
    );
    return normalizeSale(res.data);
  },
};
