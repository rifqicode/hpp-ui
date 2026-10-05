import apiClient from '../../../lib/api-client';

export interface MaterialOption {
  id: string;
  name: string;
  baseUnit: string;
  currentStock?: number;
  latestPrice?: number;
}

const DEFAULT_MATERIALS: MaterialOption[] = [
  { id: "mat-1", name: "Tepung Terigu", baseUnit: "kg", currentStock: 1.2, latestPrice: 12000 },
  { id: "mat-2", name: "Minyak Goreng", baseUnit: "L", currentStock: 0.5, latestPrice: 16000 },
  { id: "mat-3", name: "Gula Pasir", baseUnit: "kg", currentStock: 10, latestPrice: 15000 },
  { id: "mat-4", name: "Ragi", baseUnit: "g", currentStock: 0, latestPrice: 50 },
  { id: "mat-5", name: "Susu Bubuk", baseUnit: "kg", currentStock: 2.5, latestPrice: 65000 },
  { id: "mat-6", name: "Mentega", baseUnit: "kg", currentStock: 0.8, latestPrice: 35000 },
];

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
