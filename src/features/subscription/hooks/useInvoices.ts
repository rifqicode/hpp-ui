import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { subscriptionKeys } from './useSubscriptionUsage';

export const useInvoices = () => {
  return useQuery({
    queryKey: subscriptionKeys.invoices(),
    queryFn: () => subscriptionService.getInvoices(),
    staleTime: 60 * 1000,
  });
};
