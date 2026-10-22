import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { SUBSCRIPTION_USAGE_QUERY_KEY } from './useSubscriptionUsage';
import type { SubscriptionTier } from '../types/subscription';
import { useAuthStore } from '@/store/use-auth-store';

export interface CheckoutParams {
  tier: SubscriptionTier;
  paymentMethod?: string;
}

export const useCheckout = () => {
  const queryClient = useQueryClient();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  return useMutation({
    mutationFn: (params: SubscriptionTier | CheckoutParams) => {
      if (typeof params === 'string') {
        return subscriptionService.checkout(params);
      }
      return subscriptionService.checkout(params.tier, params.paymentMethod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });
};
