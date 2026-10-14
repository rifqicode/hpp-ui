import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { useAuthStore } from '@/store/use-auth-store';

export const SUBSCRIPTION_USAGE_QUERY_KEY = 'subscription-usage';

export const subscriptionKeys = {
  all: ['subscription'] as const,
  plans: () => ['subscription-plans'] as const,
  usage: (storeId?: string | null) => [SUBSCRIPTION_USAGE_QUERY_KEY, storeId] as const,
  invoices: () => ['subscription-invoices'] as const,
  notifications: () => ['notifications'] as const,
};

export const useSubscriptionUsage = () => {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  return useQuery({
    queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId],
    queryFn: () => subscriptionService.getUsage(),
    enabled: Boolean(activeStoreId),
    staleTime: 60 * 1000, // 1 minute stale time to prevent redundant calls
    refetchOnWindowFocus: false,
  });
};
