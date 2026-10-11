import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import type { OperationalDashboardData, HPPDashboardData } from '../types';

export const dashboardService = {
  getOperationalDashboard: async (storeId?: string): Promise<OperationalDashboardData> => {
    const targetStoreId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetStoreId) {
      throw new Error('Active store ID is required');
    }
    const response = await apiClient.get<OperationalDashboardData>(
      `/stores/${targetStoreId}/dashboard/operational`
    );
    return response.data;
  },

  getHPPDashboard: async (
    period: 'today' | 'week' | 'month' = 'week',
    storeId?: string
  ): Promise<HPPDashboardData> => {
    const targetStoreId = storeId || useAuthStore.getState().activeStoreId;
    if (!targetStoreId) {
      throw new Error('Active store ID is required');
    }
    const response = await apiClient.get<HPPDashboardData>(
      `/stores/${targetStoreId}/dashboard/hpp?period=${period}`
    );
    return response.data;
  },
};
