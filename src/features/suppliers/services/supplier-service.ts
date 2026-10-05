import apiClient from '../../../lib/api-client';
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierPurchaseRecord,
} from '../types';

// Initial mock data used if backend API is not yet reachable
let LOCAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "PT Sumber Pangan Sejahtera",
    contact: "0812-3456-7890",
    address: "Jl. Industri Raya No. 45, Kawasan Pergudangan Cikarang, Bekasi",
    createdAt: "2024-01-15T08:30:00Z",
    totalPurchases: 14500000,
    totalOrdersCount: 12,
    suppliedMaterials: ["Tepung Terigu", "Gula Pasir", "Ragi"],
  },
  {
    id: "sup-2",
    name: "CV Grosir Jaya Abadi",
    contact: "0819-8765-4321 / order@grosirjaya.co.id",
    address: "Pasar Induk Kramat Jati Blok C No. 12, Jakarta Timur",
    createdAt: "2024-02-01T10:00:00Z",
    totalPurchases: 8750000,
    totalOrdersCount: 8,
    suppliedMaterials: ["Minyak Goreng", "Mentega"],
  },
  {
    id: "sup-3",
    name: "Toko Bahan Kue 88",
    contact: "0857-1122-3344",
    address: "Jl. Margonda Raya No. 88, Depok",
    createdAt: "2024-02-20T14:15:00Z",
    totalPurchases: 4200000,
    totalOrdersCount: 5,
    suppliedMaterials: ["Susu Bubuk", "Perisa Makanan", "Coklat Bubuk"],
  },
  {
    id: "sup-4",
    name: "UD Berkah Tani Mandiri",
    contact: "info@berkahtani.id",
    address: "Jl. Raya Bogor KM 32, Cibinong",
    createdAt: "2024-03-05T09:00:00Z",
    totalPurchases: 2100000,
    totalOrdersCount: 2,
    suppliedMaterials: ["Telur Ayam", "Susu Segar"],
  },
];

const MOCK_PURCHASE_HISTORY: Record<string, SupplierPurchaseRecord[]> = {
  "sup-1": [
    {
      id: "po-101",
      stockName: "Tepung Terigu",
      quantity: 100,
      baseUnit: "kg",
      totalPrice: 1200000,
      pricePerUnit: 12000,
      purchaseDate: "2024-05-10T11:00:00Z",
    },
    {
      id: "po-102",
      stockName: "Gula Pasir",
      quantity: 50,
      baseUnit: "kg",
      totalPrice: 750000,
      pricePerUnit: 15000,
      purchaseDate: "2024-05-02T09:30:00Z",
    },
    {
      id: "po-103",
      stockName: "Tepung Terigu",
      quantity: 150,
      baseUnit: "kg",
      totalPrice: 1725000,
      pricePerUnit: 11500,
      purchaseDate: "2024-04-18T14:20:00Z",
    },
  ],
  "sup-2": [
    {
      id: "po-201",
      stockName: "Minyak Goreng",
      quantity: 40,
      baseUnit: "L",
      totalPrice: 640000,
      pricePerUnit: 16000,
      purchaseDate: "2024-05-08T13:45:00Z",
    },
    {
      id: "po-202",
      stockName: "Mentega",
      quantity: 25,
      baseUnit: "kg",
      totalPrice: 875000,
      pricePerUnit: 35000,
      purchaseDate: "2024-04-25T10:00:00Z",
    },
  ],
  "sup-3": [
    {
      id: "po-301",
      stockName: "Susu Bubuk",
      quantity: 20,
      baseUnit: "kg",
      totalPrice: 1300000,
      pricePerUnit: 65000,
      purchaseDate: "2024-05-04T15:10:00Z",
    },
  ],
  "sup-4": [
    {
      id: "po-401",
      stockName: "Telur Ayam",
      quantity: 30,
      baseUnit: "kg",
      totalPrice: 900000,
      pricePerUnit: 30000,
      purchaseDate: "2024-05-01T08:00:00Z",
    },
  ],
};

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
