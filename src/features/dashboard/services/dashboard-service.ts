import apiClient from '@/lib/api-client';
import type { OperationalDashboardData, HPPDashboardData } from '../types';
import type { DashboardOverview, OverviewRange } from '../types/overview';

export const dashboardService = {
  getOverview: async (storeId: string, range?: Partial<OverviewRange>, signal?: AbortSignal): Promise<DashboardOverview> => {
    const response = await apiClient.get<DashboardOverview>('/dashboard/overview', {
      params: range, signal, headers: { 'X-Store-ID': storeId },
    });
    return response.data;
  },
  getOperationalDashboard: async (storeId?: string): Promise<OperationalDashboardData> => {
    const response = storeId
      ? await apiClient.get<OperationalDashboardData>('/dashboard/operational', { headers: { 'X-Store-ID': storeId } })
      : await apiClient.get<OperationalDashboardData>('/dashboard/operational');
    return response.data;
  },

  getHPPDashboard: async (
    period: 'today' | 'week' | 'month' = 'week',
    storeId?: string
  ): Promise<HPPDashboardData> => {
    const response = storeId
      ? await apiClient.get<HPPDashboardData>(`/dashboard/hpp?period=${period}`, { headers: { 'X-Store-ID': storeId } })
      : await apiClient.get<HPPDashboardData>(`/dashboard/hpp?period=${period}`);
    return response.data;
  },
};
