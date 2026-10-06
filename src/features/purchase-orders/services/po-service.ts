import apiClient from '../../../lib/api-client';
import type {
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  ApprovePOInput,
  RejectPOInput,
  CompletePurchaseOrderInput,
  CompletePOPriceItem,
  PurchaseOrderQueryParams,
  PaginatedPurchaseOrders,
  PurchaseOrderStatus,
} from '../types';

interface RawPurchaseOrderItem {
  id: string;
  stock_id: string;
  stock_name: string;
  quantity: number | string;
  base_unit: string;
  unit_price: number | string;
  total_price: number | string;
}

interface RawPurchaseOrderLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  notes?: string;
  created_at: string;
}

interface RawPurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  supplier_name: string;
  created_by_user_id?: string;
  created_by_name?: string;
  order_date: string;
  completed_date?: string;
  status: PurchaseOrderStatus;
  notes?: string;
  total_amount: number | string;
  items?: RawPurchaseOrderItem[];
  logs?: RawPurchaseOrderLog[];
  created_at: string;
}

interface RawPaginatedResponse {
  items: RawPurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

function mapRawPOToPurchaseOrder(raw: RawPurchaseOrder): PurchaseOrder {
  return {
    id: raw.id,
    poNumber: raw.po_number,
    supplierId: raw.supplier_id,
    supplierName: raw.supplier_name || "-",
    createdByUserId: raw.created_by_user_id,
    createdByName: raw.created_by_name || "-",
    orderDate: raw.order_date,
    completedDate: raw.completed_date,
    status: raw.status,
    notes: raw.notes || "",
    totalAmount: Number(raw.total_amount) || 0,
    createdAt: raw.created_at,
    items: (raw.items || []).map((it) => ({
      id: it.id,
      stockId: it.stock_id,
      stockName: it.stock_name,
      quantity: Number(it.quantity) || 0,
      baseUnit: it.base_unit,
      unitPrice: Number(it.unit_price) || 0,
      totalPrice: Number(it.total_price) || 0,
    })),
    logs: (raw.logs || []).map((l) => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name || "-",
      action: l.action,
      notes: l.notes,
      createdAt: l.created_at,
    })),
  };
}

export const purchaseOrderService = {
  getPurchaseOrders: async (params?: PurchaseOrderQueryParams): Promise<PaginatedPurchaseOrders> => {
    const response = await apiClient.get<RawPaginatedResponse | RawPurchaseOrder[]>('/purchase-orders', {
      params,
    });

    const data = response.data;
    if (data && "items" in data && Array.isArray(data.items)) {
      return {
        items: data.items.map(mapRawPOToPurchaseOrder),
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.total_pages || 1,
      };
    }

    if (Array.isArray(data)) {
      const items = data.map(mapRawPOToPurchaseOrder);
      return {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
        totalPages: 1,
      };
    }

    return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<RawPurchaseOrder>(`/purchase-orders/${id}`);
    return mapRawPOToPurchaseOrder(response.data);
  },

  createPurchaseOrder: async (input: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const response = await apiClient.post<RawPurchaseOrder>('/purchase-orders', input);
    return mapRawPOToPurchaseOrder(response.data);
  },

  updatePurchaseOrder: async (id: string, input: UpdatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const response = await apiClient.put<RawPurchaseOrder>(`/purchase-orders/${id}`, input);
    return mapRawPOToPurchaseOrder(response.data);
  },

  approvePurchaseOrder: async (id: string, input?: ApprovePOInput): Promise<PurchaseOrder> => {
    const response = await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/approve`, input || {});
    return mapRawPOToPurchaseOrder(response.data);
  },

  rejectPurchaseOrder: async (id: string, input: RejectPOInput): Promise<PurchaseOrder> => {
    const response = await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/reject`, input);
    return mapRawPOToPurchaseOrder(response.data);
  },

  completePurchaseOrder: async (
    id: string,
    payload: CompletePurchaseOrderInput | CompletePOPriceItem[]
  ): Promise<PurchaseOrder> => {
    const body = Array.isArray(payload) ? { prices: payload } : payload;
    const response = await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/complete`, body);
    return mapRawPOToPurchaseOrder(response.data);
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/cancel`);
    return mapRawPOToPurchaseOrder(response.data);
  },
};
