import { useQuery } from '@tanstack/react-query';
import { supplierService } from '../services/supplier-service';
import type { SupplierQueryParams } from '../types';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params?: SupplierQueryParams) => [...supplierKeys.lists(), params] as const,
  allItems: () => [...supplierKeys.all, 'all-items'] as const,
  summary: () => [...supplierKeys.all, 'summary'] as const,
  detail: (id: string) => [...supplierKeys.all, 'detail', id] as const,
  purchases: (id: string) => [...supplierKeys.all, 'purchases', id] as const,
};

export function useSuppliersQuery(params?: SupplierQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => supplierService.getSuppliers(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSupplierSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: supplierKeys.summary(),
    queryFn: () => supplierService.getSupplierSummary(),
    enabled: options?.enabled ?? true,
  });
}
