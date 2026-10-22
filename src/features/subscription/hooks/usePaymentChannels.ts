import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import type { PaymentChannelConfig } from '../types/subscription';

export const PAYMENT_CHANNELS_QUERY_KEY = 'payment-channels';

export const usePaymentChannels = (enabled: boolean = true) => {
  return useQuery<PaymentChannelConfig[]>({
    queryKey: [PAYMENT_CHANNELS_QUERY_KEY],
    queryFn: () => subscriptionService.getPaymentChannels(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
