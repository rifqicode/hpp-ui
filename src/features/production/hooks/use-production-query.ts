import { useQuery } from '@tanstack/react-query';
import { productionService } from '../services/production-service';

export const productionKeys = {
  all: ['production'] as const,
  batches: () => [...productionKeys.all, 'batches'] as const,
  batch: (id: string) => [...productionKeys.all, 'batch', id] as const,
};

export function useBatchesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productionKeys.batches(),
    queryFn: () => productionService.getBatches(),
    enabled: options?.enabled ?? true,
  });
}

export function useBatchDetailQuery(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productionKeys.batch(id || ''),
    queryFn: () => productionService.getBatchById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}
