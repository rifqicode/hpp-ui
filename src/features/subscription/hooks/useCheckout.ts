import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { SUBSCRIPTION_USAGE_QUERY_KEY } from './useSubscriptionUsage';
import type { SubscriptionTier } from '../types/subscription';
import { useAuthStore } from '@/store/use-auth-store';

export const useCheckout = () => {
  const queryClient = useQueryClient();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  return useMutation({
    mutationFn: (tier: SubscriptionTier) => subscriptionService.checkout(tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });
};
