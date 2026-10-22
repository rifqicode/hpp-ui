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
  SyncInvoiceStatusResponse,
  PaymentChannelConfig,
} from '../types/subscription';

export const subscriptionService = {
  getPlans: async (): Promise<PlanConfig[]> => {
    const response = await apiClient.get<PlanConfig[]>('/subscription/plans');
    return response.data;
  },

  getPaymentChannels: async (): Promise<PaymentChannelConfig[]> => {
    try {
      const response = await apiClient.get<PaymentChannelConfig[]>('/subscription/payment-methods');
      return response.data;
    } catch {
      return [
        { code: 'qris', name: 'QRIS', category: 'QRIS', description: 'GoPay, OVO, DANA, ShopeePay, BCA, Livin, dll', enabled: true },
        { code: 'bca_va', name: 'BCA Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BCA Mobile, KlikBCA, atau ATM', enabled: true },
        { code: 'mandiri_va', name: 'Mandiri Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via Livin\' by Mandiri atau ATM', enabled: true },
        { code: 'bni_va', name: 'BNI Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BNI Mobile atau ATM', enabled: true },
        { code: 'bri_va', name: 'BRI Virtual Account (BRIVA)', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BRImo atau ATM', enabled: true },
      ];
    }
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

  checkout: async (tier: SubscriptionTier, paymentMethod?: string): Promise<CheckoutResponseData> => {
    const response = await apiClient.post<CheckoutResponseData>(
      '/subscription/checkout',
      { tier, payment_method: paymentMethod }
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

  cancelInvoice: async (invoiceId: string): Promise<void> => {
    await apiClient.post(`/subscription/invoices/${encodeURIComponent(invoiceId)}/cancel`);
  },

  syncStatus: async (invoiceId: string, transactionId?: string): Promise<SyncInvoiceStatusResponse> => {
    const params = transactionId ? `?transaction_id=${encodeURIComponent(transactionId)}` : '';
    const response = await apiClient.post<SyncInvoiceStatusResponse>(
      `/subscription/invoices/${encodeURIComponent(invoiceId)}/sync-status${params}`
    );
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
