import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';

export const usePlans = (enabled = true) => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
};

