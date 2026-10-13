import apiClient from '@/lib/api-client';
import type { OperationalDashboardData, HPPDashboardData } from '../types';

export const dashboardService = {
  getOperationalDashboard: async (_storeId?: string): Promise<OperationalDashboardData> => {
    const response = await apiClient.get<OperationalDashboardData>(
      `/dashboard/operational`
    );
    return response.data;
  },

  getHPPDashboard: async (
    period: 'today' | 'week' | 'month' = 'week',
    _storeId?: string
  ): Promise<HPPDashboardData> => {
    const response = await apiClient.get<HPPDashboardData>(
      `/dashboard/hpp?period=${period}`
    );
    return response.data;
  },
};
