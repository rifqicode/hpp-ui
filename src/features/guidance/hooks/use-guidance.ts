import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';
import { guidanceService } from '../services/guidance-service';
import { GUIDANCE_REGISTRY, ORDERED_GUIDANCE_KEYS } from '../config/guidance-registry';
import type { CompleteGuidancePayload, GuidanceItem, GuidanceProgressItem } from '../types';

export function useGuidancesQuery() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  return useQuery({
    queryKey: ['guidances', activeStoreId],
    queryFn: ({ signal }) => {
      if (!activeStoreId) return Promise.resolve<GuidanceItem[]>([]);
      return guidanceService.list(activeStoreId, signal);
    },
    enabled: Boolean(activeStoreId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCompleteGuidanceMutation() {
  const queryClient = useQueryClient();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  return useMutation({
    mutationFn: ({ key, payload }: { key: string; payload?: CompleteGuidancePayload }) => {
      if (!activeStoreId) throw new Error('No active store selected');
      return guidanceService.complete(activeStoreId, key, payload);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<GuidanceItem[]>(['guidances', activeStoreId], (old) => {
        if (!old) return [updatedItem];
        const exists = old.some((item) => item.guidance === updatedItem.guidance);
        if (exists) {
          return old.map((item) => (item.guidance === updatedItem.guidance ? updatedItem : item));
        }
        return [...old, updatedItem];
      });
      void queryClient.invalidateQueries({ queryKey: ['guidances', activeStoreId] });
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useGuidanceProgress() {
  const { data: serverGuidances = [], isLoading } = useGuidancesQuery();

  const guidanceMap = new Map<string, GuidanceItem>();
  for (const item of serverGuidances) {
    guidanceMap.set(item.guidance, item);
  }

  const items: GuidanceProgressItem[] = ORDERED_GUIDANCE_KEYS.map((key) => {
    const config = GUIDANCE_REGISTRY[key];
    const serverItem = guidanceMap.get(key);
    const isCompleted = serverItem?.is_completed ?? false;
    const isSkipped = Boolean(serverItem?.metadata?.skipped);
    return {
      key,
      config,
      isCompleted,
      isSkipped,
      completedAt: serverItem?.completed_at,
    };
  });

  const total = items.length;
  const completed = items.filter((item) => item.isCompleted).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllCompleted = total > 0 && completed === total;
  const nextGuidance = items.find((item) => !item.isCompleted) ?? null;

  return {
    items,
    total,
    completed,
    percent,
    isAllCompleted,
    nextGuidance,
    isLoading,
  };
}
