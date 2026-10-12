import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/sales-service';
import { customerService } from '../services/customer-service';
import type { SaleQuery } from '../types';

export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  list: (query?: SaleQuery) => [...salesKeys.lists(), query] as const,
  summary: (query?: SaleQuery) => [...salesKeys.all, 'summary', query] as const,
  detail: (id: string) => [...salesKeys.all, 'detail', id] as const,
  customers: {
    all: ['customers'] as const,
    lists: () => ['customers', 'list'] as const,
    list: (query?: { search?: string; page?: number; per_page?: number }) => ['customers', 'list', query] as const,
    summary: () => ['customers', 'summary'] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
};

export function useSalesTransactionsQuery(query?: SaleQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.list(query),
    queryFn: () => salesService.getPaginatedSales(query),
    enabled: options?.enabled ?? true,
  });
}

export function useSalesListQuery(query?: SaleQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...salesKeys.lists(), 'raw', query],
    queryFn: () => salesService.getSales(query),
    enabled: options?.enabled ?? true,
  });
}

export function useSalesSummaryQuery(query?: SaleQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.summary(query),
    queryFn: () => salesService.getSummary(query),
    enabled: options?.enabled ?? true,
  });
}

export function useCustomersQuery(query?: { search?: string; page?: number; per_page?: number }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.customers.list(query),
    queryFn: () => customerService.getCustomers(query),
    enabled: options?.enabled ?? true,
  });
}

export function useCustomerSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.customers.summary(),
    queryFn: () => customerService.getCustomerSummary(),
    enabled: options?.enabled ?? true,
  });
}

export function useCustomerDetailQuery(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.customers.detail(id || ''),
    queryFn: () => customerService.getCustomerById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}
