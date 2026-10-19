import { useAuthStore } from '@/store/use-auth-store';
import type { ProductionCalendarFilters } from '../types';
import { useQuery } from '@tanstack/react-query';
import { productionService } from '../services/production-service';

export const productionKeys = {
  all: ['production'] as const,
  batches: (storeId?: string | null) => [...productionKeys.all, storeId, 'batches'] as const,
  batch: (id: string, storeId?: string | null) => [...productionKeys.all, storeId, 'batch', id] as const,
  calendar: (storeId: string | null, filters: ProductionCalendarFilters) => [...productionKeys.all, storeId, 'calendar', filters] as const,
};

export function useBatchesQuery(options?: { enabled?: boolean }) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  return useQuery({
    queryKey: productionKeys.batches(storeId),
    queryFn: () => productionService.getBatches(),
    enabled: Boolean(storeId) && (options?.enabled ?? true),
  });
}

export function useBatchDetailQuery(id?: string, options?: { enabled?: boolean }) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  return useQuery({
    queryKey: productionKeys.batch(id || '', storeId),
    queryFn: () => productionService.getBatchById(id!),
    enabled: Boolean(storeId) && Boolean(id) && (options?.enabled ?? true),
  });
}

export function useProductionCalendarQuery(filters: ProductionCalendarFilters) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  return useQuery({
    queryKey: productionKeys.calendar(storeId, filters),
    queryFn: ({ signal }) => productionService.getCalendar(filters, storeId!, signal),
    enabled: Boolean(storeId),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
