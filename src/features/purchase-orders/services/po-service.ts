import { getAttachmentContentType, type POAttachment } from '../lib/attachment';
import apiClient from '../../../lib/api-client';
import type {
  PurchaseOrder,
  PurchaseOrderSummary,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  ApprovePOInput,
  RejectPOInput,
  CompletePurchaseOrderInput,
  CompletePOPriceItem,
  ReceivePOInput,
  PayPOInput,
  CancelPOInput,
  PurchaseOrderReceiptStatus,
  PurchaseOrderPaymentStatus,
  PurchaseOrderPaymentMethod,
  PurchaseOrderQueryParams,
  PaginatedPurchaseOrders,
  PurchaseOrderStatus,
  PurchaseOrderCategory,
} from '../types';

interface RawPurchaseOrderItem {
  id: string;
  stock_id: string;
  stock_name: string;
  quantity: number | string;
  base_unit: string;
  unit_price: number | string;
  total_price: number | string;
  inventory_method?: 'FIFO' | 'FEFO';
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
  category?: PurchaseOrderCategory;
  attachment_url?: string;
  attachment_name?: string;
  attachments?: POAttachment[];
  completion_attachments?: POAttachment[];
  supplier_id?: string;
  supplier_name: string;
  created_by_user_id?: string;
  created_by_name?: string;
  order_date: string;
  completed_date?: string;
  status: PurchaseOrderStatus;
  receipt_status?: PurchaseOrderReceiptStatus;
  payment_status?: PurchaseOrderPaymentStatus;
  payment_method?: PurchaseOrderPaymentMethod;
  payment_due_date?: string;
  received_at?: string;
  received_by_user_id?: string;
  received_by_name?: string;
  paid_at?: string;
  paid_by_user_id?: string;
  paid_by_name?: string;
  cancellation_reason?: string;
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
    category: raw.category || "PURCHASE_ORDER",
    attachmentUrl: raw.attachment_url,
    attachmentName: raw.attachment_name,
    attachments: raw.attachments?.length ? raw.attachments : raw.attachment_url ? [{ url: raw.attachment_url, name: raw.attachment_name || 'Dokumen PO' }] : [],
    completionAttachments: raw.completion_attachments || [],
    supplierId: raw.supplier_id,
    supplierName: raw.supplier_name || "-",
    createdByUserId: raw.created_by_user_id,
    createdByName: raw.created_by_name || "-",
    orderDate: raw.order_date,
    completedDate: raw.completed_date,
    status: raw.status,
    receiptStatus: raw.receipt_status || "NOT_RECEIVED",
    paymentStatus: raw.payment_status || "UNPAID",
    paymentMethod: raw.payment_method,
    paymentDueDate: raw.payment_due_date,
    receivedAt: raw.received_at,
    receivedByUserId: raw.received_by_user_id,
    receivedByName: raw.received_by_name,
    paidAt: raw.paid_at,
    paidByUserId: raw.paid_by_user_id,
    paidByName: raw.paid_by_name,
    cancellationReason: raw.cancellation_reason,
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
      inventoryMethod: it.inventory_method,
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
  uploadAttachment: async (file: File, onProgress?: (progress: number) => void, purpose: 'request' | 'completion' = 'request'): Promise<POAttachment> => {
    const contentType = getAttachmentContentType(file);
    const endpoint = purpose === 'completion' ? '/purchase-orders/completion-upload-presigned-url' : '/purchase-orders/upload-presigned-url';
    const { data } = await apiClient.post<{ upload_url: string; public_url: string }>(endpoint, {
      filename: file.name,
      content_type: contentType,
      file_size: file.size,
    });
    if (!data.upload_url || !data.public_url) throw new Error('Gagal mendapatkan URL upload dokumen. Silakan coba lagi.');
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('PUT', data.upload_url);
      request.timeout = 120000;
      request.setRequestHeader('Content-Type', contentType);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100));
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) resolve();
        else reject(new Error(`Upload dokumen gagal (HTTP ${request.status}). Silakan coba lagi.`));
      };
      request.onerror = () => reject(new Error('Upload dokumen gagal. Periksa koneksi lalu coba lagi.'));
      request.ontimeout = () => reject(new Error('Upload dokumen terlalu lama. Silakan coba lagi.'));
      request.onabort = () => reject(new Error('Upload dokumen dibatalkan.'));
      request.send(file);
    });
    onProgress?.(100);
    return { url: data.public_url, name: file.name };
  },

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

  receivePurchaseOrder: async (id: string, input?: ReceivePOInput): Promise<PurchaseOrder> => {
    const response = await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/receive`, input || {});
    return mapRawPOToPurchaseOrder(response.data);
  },

  payPurchaseOrder: async (id: string, input: PayPOInput): Promise<PurchaseOrder> => {
    const response = await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/pay`, input);
    return mapRawPOToPurchaseOrder(response.data);
  },

  getPurchaseOrderSummary: async (): Promise<PurchaseOrderSummary> => {
    const response = await apiClient.get<PurchaseOrderSummary>('/purchase-orders/summary');
    return response.data;
  },

  cancelPurchaseOrder: async (id: string, input?: CancelPOInput): Promise<PurchaseOrder> => {
    const response = input
      ? await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/cancel`, input)
      : await apiClient.post<RawPurchaseOrder>(`/purchase-orders/${id}/cancel`);
    return mapRawPOToPurchaseOrder(response.data);
  },
};

export const poService = purchaseOrderService;
export default purchaseOrderService;
