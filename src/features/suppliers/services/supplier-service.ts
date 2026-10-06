import apiClient from "@/lib/api-client"
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierPurchaseRecord,
  SupplierQueryParams,
  PaginatedSuppliers,
} from "../types"

export const supplierService = {
  getSuppliers: async (params?: SupplierQueryParams): Promise<PaginatedSuppliers> => {
    const response = await apiClient.get<any>("/suppliers", { params })
    if (response.data && Array.isArray(response.data.items)) {
      return response.data as PaginatedSuppliers
    }
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1,
      }
    }
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 }
  },

  getAllSuppliers: async (): Promise<Supplier[]> => {
    const res = await supplierService.getSuppliers({ page: 1, limit: 1000 })
    return res.items
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}`)
    return response.data
  },

  createSupplier: async (data: CreateSupplierInput): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>("/suppliers", data)
    return response.data
  },

  updateSupplier: async (id: string, data: UpdateSupplierInput): Promise<Supplier> => {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}`, data)
    return response.data
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`)
  },

  getSupplierPurchases: async (supplierId: string): Promise<SupplierPurchaseRecord[]> => {
    const response = await apiClient.get<SupplierPurchaseRecord[]>(`/suppliers/${supplierId}/purchases`)
    return Array.isArray(response.data) ? response.data : []
  },
}
