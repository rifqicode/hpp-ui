import apiClient from '@/lib/api-client';
import type {
  PlanConfig,
  SubscriptionUsageData,
  SubscriptionNotification,
  SubscriptionInvoice,
  SubscriptionTier,
  SubscribeResponseData,
  CheckoutResponseData,
  MidtransConfigData,
} from '../types/subscription';

export const subscriptionService = {
  getPlans: async (): Promise<PlanConfig[]> => {
    const response = await apiClient.get<PlanConfig[]>('/subscription/plans');
    return response.data;
  },

  getUsage: async (): Promise<SubscriptionUsageData> => {
    const response = await apiClient.get<SubscriptionUsageData>('/subscription/usage');
    return response.data;
  },

  subscribe: async (tier: SubscriptionTier): Promise<SubscribeResponseData> => {
    const response = await apiClient.post<SubscribeResponseData>(
      '/subscription/subscribe',
      { tier }
    );
    return response.data;
  },

  checkout: async (tier: SubscriptionTier): Promise<CheckoutResponseData> => {
    const response = await apiClient.post<CheckoutResponseData>(
      '/subscription/checkout',
      { tier }
    );
    return response.data;
  },

  getMidtransConfig: async (): Promise<MidtransConfigData> => {
    const response = await apiClient.get<MidtransConfigData>('/subscription/config/client');
    return response.data;
  },

  getInvoices: async (): Promise<SubscriptionInvoice[]> => {
    const response = await apiClient.get<SubscriptionInvoice[]>('/subscription/invoices');
    return response.data;
  },

  getNotifications: async (): Promise<SubscriptionNotification[]> => {
    const response = await apiClient.get<SubscriptionNotification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },
};
