import { useQuery } from '@tanstack/react-query';
import { overheadService } from '../services/overhead-service';
import type { OverheadQuery, OverheadCategory } from '../types';

export const overheadKeys = {
  all: ['overheads'] as const,
  lists: () => [...overheadKeys.all, 'list'] as const,
  list: (query?: OverheadQuery) => [...overheadKeys.lists(), query] as const,
  allItems: (query?: { activeOnly?: boolean; category?: OverheadCategory }) => [...overheadKeys.all, 'all-items', query] as const,
  summary: () => [...overheadKeys.all, 'summary'] as const,
  detail: (id: string) => [...overheadKeys.all, 'detail', id] as const,
};

export function useOverheadsQuery(query?: OverheadQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: overheadKeys.list(query),
    queryFn: () => overheadService.getPaginatedOverheads(query),
    enabled: options?.enabled ?? true,
  });
}

export function useAllOverheadsQuery(query?: { activeOnly?: boolean; category?: OverheadCategory }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: overheadKeys.allItems(query),
    queryFn: () => overheadService.getOverheads(query),
    enabled: options?.enabled ?? true,
  });
}

export function useOverheadSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: overheadKeys.summary(),
    queryFn: () => overheadService.getOverheadSummary(),
    enabled: options?.enabled ?? true,
  });
}

export function useOverheadDetailQuery(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: overheadKeys.detail(id || ''),
    queryFn: () => overheadService.getOverheadById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}
