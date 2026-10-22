import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { subscriptionKeys } from './useSubscriptionUsage';
import { useSubscriptionUsage } from './useSubscriptionUsage';
import { useAuthStore } from '@/store/use-auth-store';
import { usePaymentState } from '../lib/payment-state';

export const useInvoices = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const storeId = useAuthStore((state) => state.activeStoreId);
  const { data: usage } = useSubscriptionUsage();
  const polling = usePaymentState((state) => state.scope === `${userId}:${storeId}` ? state.pollUntil : 0);
  return useQuery({
    queryKey: subscriptionKeys.invoices(userId, storeId),
    queryFn: () => subscriptionService.getInvoices(),
    enabled: Boolean(userId && storeId && usage?.can_manage_billing),
    staleTime: 60 * 1000,
    refetchInterval: () => polling > Date.now() ? 2000 : false,
  });
};
