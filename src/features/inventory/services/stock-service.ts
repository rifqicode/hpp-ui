import apiClient from '../../../lib/api-client';

export interface MaterialOption {
  id: string;
  name: string;
  baseUnit: string;
  currentStock?: number;
  latestPrice?: number;
}

const DEFAULT_MATERIALS: MaterialOption[] = [];

export const stockService = {
  getMaterials: async (): Promise<MaterialOption[]> => {
    try {
      const response = await apiClient.get<MaterialOption[]>('/stocks');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return DEFAULT_MATERIALS;
    } catch {
      return DEFAULT_MATERIALS;
    }
  },
};
