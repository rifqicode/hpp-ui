import apiClient from '../../../lib/api-client';
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierPurchaseRecord,
} from '../types';

// Initial mock data used if backend API is not yet reachable
let LOCAL_SUPPLIERS: Supplier[] = [];

const MOCK_PURCHASE_HISTORY: Record<string, SupplierPurchaseRecord[]> = {};

export const supplierService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const response = await apiClient.get<Supplier[]>('/suppliers');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return LOCAL_SUPPLIERS;
    } catch {
      // Backend not yet reachable or route 404, fallback to mock state
      return [...LOCAL_SUPPLIERS];
    }
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    try {
      const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
      return response.data;
    } catch {
      const found = LOCAL_SUPPLIERS.find((s) => s.id === id);
      if (!found) {
        throw new Error('Supplier tidak ditemukan');
      }
      return found;
    }
  },

  createSupplier: async (data: CreateSupplierInput): Promise<Supplier> => {
    try {
      const response = await apiClient.post<Supplier>('/suppliers', data);
      return response.data;
    } catch {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        name: data.name,
        contact: data.contact,
        address: data.address,
        createdAt: new Date().toISOString(),
        totalPurchases: 0,
        totalOrdersCount: 0,
        suppliedMaterials: [],
      };
      LOCAL_SUPPLIERS = [newSupplier, ...LOCAL_SUPPLIERS];
      return newSupplier;
    }
  },

  updateSupplier: async (id: string, data: UpdateSupplierInput): Promise<Supplier> => {
    try {
      const response = await apiClient.put<Supplier>(`/suppliers/${id}`, data);
      return response.data;
    } catch {
      const index = LOCAL_SUPPLIERS.findIndex((s) => s.id === id);
      if (index === -1) {
        throw new Error('Supplier tidak ditemukan');
      }
      const updated: Supplier = {
        ...LOCAL_SUPPLIERS[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      LOCAL_SUPPLIERS[index] = updated;
      return updated;
    }
  },

  deleteSupplier: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/suppliers/${id}`);
    } catch {
      LOCAL_SUPPLIERS = LOCAL_SUPPLIERS.filter((s) => s.id !== id);
    }
  },

  getSupplierPurchases: async (supplierId: string): Promise<SupplierPurchaseRecord[]> => {
    try {
      const response = await apiClient.get<SupplierPurchaseRecord[]>(`/suppliers/${supplierId}/purchases`);
      return response.data;
    } catch {
      return MOCK_PURCHASE_HISTORY[supplierId] || [];
    }
  },
};
