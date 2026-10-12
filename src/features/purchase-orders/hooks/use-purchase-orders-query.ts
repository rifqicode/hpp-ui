import { useQuery } from '@tanstack/react-query';
import { poService } from '../services/po-service';
import type { PurchaseOrderQueryParams, PaginatedPurchaseOrders } from '../types';

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (params?: PurchaseOrderQueryParams) => [...purchaseOrderKeys.lists(), params] as const,
  summary: () => [...purchaseOrderKeys.all, 'summary'] as const,
  detail: (id: string) => [...purchaseOrderKeys.all, 'detail', id] as const,
};

export function usePurchaseOrdersQuery(params?: PurchaseOrderQueryParams, options?: { enabled?: boolean }) {
  return useQuery<PaginatedPurchaseOrders>({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => poService.getPurchaseOrders(params),
    enabled: options?.enabled ?? true,
  });
}

export function usePurchaseOrderSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: purchaseOrderKeys.summary(),
    queryFn: () => poService.getPurchaseOrderSummary(),
    enabled: options?.enabled ?? true,
  });
}

export function usePurchaseOrderDetailQuery(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id || ''),
    queryFn: () => poService.getPurchaseOrderById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}
