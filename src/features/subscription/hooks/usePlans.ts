import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';

export const usePlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['subscription-invoices'],
    queryFn: () => subscriptionService.getInvoices(),
    staleTime: 60 * 1000,
  });
};
