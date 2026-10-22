import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { useAuthStore } from '@/store/use-auth-store';
import { usePaymentState } from '../lib/payment-state';

export const SUBSCRIPTION_USAGE_QUERY_KEY = 'subscription-usage';

export const subscriptionKeys = {
  all: ['subscription'] as const,
  plans: () => ['subscription-plans'] as const,
  usage: (storeId?: string | null) => [SUBSCRIPTION_USAGE_QUERY_KEY, storeId] as const,
  invoices: (userId?: string, storeId?: string | null) => ['subscription-invoices', userId, storeId] as const,
  notifications: () => ['notifications'] as const,
};

export const useSubscriptionUsage = () => {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const userId = useAuthStore((state) => state.user?.id);
  const polling = usePaymentState((state) => state.scope === `${userId}:${activeStoreId}` ? state.pollUntil : 0);

  return useQuery({
    queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId, userId],
    queryFn: () => subscriptionService.getUsage(),
    enabled: Boolean(activeStoreId),
    staleTime: 60 * 1000, // 1 minute stale time to prevent redundant calls
    refetchOnWindowFocus: false,
    refetchInterval: () => polling > Date.now() ? 2000 : false,
  });
};
