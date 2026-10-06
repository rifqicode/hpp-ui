export interface Supplier {
  id: string;
  storeId?: string;
  name: string;
  contact: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
  totalPurchases?: number;
  totalOrdersCount?: number;
  suppliedMaterials?: string[];
}

export interface CreateSupplierInput {
  name: string;
  contact: string;
  address: string;
}

export interface UpdateSupplierInput {
  name?: string;
  contact?: string;
  address?: string;
}

export interface SupplierPurchaseRecord {
  id: string;
  stockName: string;
  quantity: number;
  baseUnit: string;
  totalPrice: number;
  pricePerUnit: number;
  purchaseDate: string;
}

export interface SupplierQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface PaginatedSuppliers {
  items: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

