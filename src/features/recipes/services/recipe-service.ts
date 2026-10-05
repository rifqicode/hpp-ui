import apiClient from '../../../lib/api-client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AddIngredientInput,
  RawMaterialStock,
  RecipeIngredient,
} from '../types';

export const AVAILABLE_MATERIALS: RawMaterialStock[] = [
  { id: "mat-1", name: "Tepung Terigu Protein Tinggi", baseUnit: "g", currentStock: 12000, avgCostPerUnit: 12 }, // Rp 12.000 / kg -> Rp 12/g
  { id: "mat-2", name: "Minyak Goreng Sawit", baseUnit: "ml", currentStock: 5000, avgCostPerUnit: 16 }, // Rp 16.000 / L -> Rp 16/ml
  { id: "mat-3", name: "Gula Pasir Kristal", baseUnit: "g", currentStock: 10000, avgCostPerUnit: 14.5 }, // Rp 14.500 / kg -> Rp 14.5/g
  { id: "mat-4", name: "Ragi Instan (Yeast)", baseUnit: "g", currentStock: 500, avgCostPerUnit: 150 }, // Rp 15.000 / 100g -> Rp 150/g
  { id: "mat-5", name: "Susu Bubuk Full Cream", baseUnit: "g", currentStock: 2500, avgCostPerUnit: 65 }, // Rp 65.000 / kg -> Rp 65/g
  { id: "mat-6", name: "Mentega / Butter", baseUnit: "g", currentStock: 2000, avgCostPerUnit: 35 }, // Rp 35.000 / kg -> Rp 35/g
  { id: "mat-7", name: "Coklat Bubuk Premium", baseUnit: "g", currentStock: 1500, avgCostPerUnit: 80 }, // Rp 80.000 / kg -> Rp 80/g
  { id: "mat-8", name: "Telur Ayam Segar", baseUnit: "g", currentStock: 4000, avgCostPerUnit: 28 }, // Rp 28.000 / kg -> Rp 28/g
  { id: "mat-9", name: "Keju Cheddar Olahan", baseUnit: "g", currentStock: 1800, avgCostPerUnit: 75 }, // Rp 75.000 / kg -> Rp 75/g
  { id: "mat-10", name: "Garam Halus", baseUnit: "g", currentStock: 3000, avgCostPerUnit: 5 }, // Rp 5.000 / kg -> Rp 5/g
];

let LOCAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Roti Manis Coklat Lumer",
    category: "Roti",
    unit: "pcs",
    sellingPrice: 8500,
    currentStock: 45,
    latestHpp: 3250,
    minStock: 15,
    description: "Roti manis bertekstur lembut dengan isian coklat premium leleh khas Toko Roti.",
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-05-10T14:30:00Z",
    ingredients: [
      {
        id: "ing-101",
        productId: "prod-1",
        stockId: "mat-1",
        stockName: "Tepung Terigu Protein Tinggi",
        baseUnit: "g",
        quantity: 50,
        unitCost: 12,
        subtotalCost: 600,
        availableStock: 12000,
      },
      {
        id: "ing-102",
        productId: "prod-1",
        stockId: "mat-3",
        stockName: "Gula Pasir Kristal",
        baseUnit: "g",
        quantity: 15,
        unitCost: 14.5,
        subtotalCost: 217.5,
        availableStock: 10000,
      },
      {
        id: "ing-103",
        productId: "prod-1",
        stockId: "mat-6",
        stockName: "Mentega / Butter",
        baseUnit: "g",
        quantity: 10,
        unitCost: 35,
        subtotalCost: 350,
        availableStock: 2000,
      },
      {
        id: "ing-104",
        productId: "prod-1",
        stockId: "mat-4",
        stockName: "Ragi Instan (Yeast)",
        baseUnit: "g",
        quantity: 2,
        unitCost: 150,
        subtotalCost: 300,
        availableStock: 500,
      },
      {
        id: "ing-105",
        productId: "prod-1",
        stockId: "mat-5",
        stockName: "Susu Bubuk Full Cream",
        baseUnit: "g",
        quantity: 5,
        unitCost: 65,
        subtotalCost: 325,
        availableStock: 2500,
      },
      {
        id: "ing-106",
        productId: "prod-1",
        stockId: "mat-7",
        stockName: "Coklat Bubuk Premium",
        baseUnit: "g",
        quantity: 15,
        unitCost: 80,
        subtotalCost: 1200,
        availableStock: 1500,
      },
      {
        id: "ing-107",
        productId: "prod-1",
        stockId: "mat-8",
        stockName: "Telur Ayam Segar",
        baseUnit: "g",
        quantity: 10,
        unitCost: 28,
        subtotalCost: 280,
        availableStock: 4000,
      },
    ],
    batches: [
      {
        id: "batch-101",
        batchNumber: "B-20240510-01",
        initialQuantity: 30,
        remainingQuantity: 15,
        hppAtProduction: 3200,
        productionDate: "2024-05-10T09:00:00Z",
        status: "active",
      },
      {
        id: "batch-102",
        batchNumber: "B-20240512-02",
        initialQuantity: 30,
        remainingQuantity: 30,
        hppAtProduction: 3300,
        productionDate: "2024-05-12T08:30:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "prod-2",
    name: "Roti Tawar Gandum Premium",
    category: "Roti",
    unit: "loaf",
    sellingPrice: 18000,
    currentStock: 18,
    latestHpp: 8450,
    minStock: 10,
    description: "Roti tawar lembut kaya serat dengan aroma butter yang harum tanpa bahan pengawet.",
    createdAt: "2024-03-05T10:00:00Z",
    updatedAt: "2024-05-11T16:00:00Z",
    ingredients: [
      {
        id: "ing-201",
        productId: "prod-2",
        stockId: "mat-1",
        stockName: "Tepung Terigu Protein Tinggi",
        baseUnit: "g",
        quantity: 260,
        unitCost: 12,
        subtotalCost: 3120,
        availableStock: 12000,
      },
      {
        id: "ing-202",
        productId: "prod-2",
        stockId: "mat-3",
        stockName: "Gula Pasir Kristal",
        baseUnit: "g",
        quantity: 25,
        unitCost: 14.5,
        subtotalCost: 362.5,
        availableStock: 10000,
      },
      {
        id: "ing-203",
        productId: "prod-2",
        stockId: "mat-6",
        stockName: "Mentega / Butter",
        baseUnit: "g",
        quantity: 35,
        unitCost: 35,
        subtotalCost: 1225,
        availableStock: 2000,
      },
      {
        id: "ing-204",
        productId: "prod-2",
        stockId: "mat-4",
        stockName: "Ragi Instan (Yeast)",
        baseUnit: "g",
        quantity: 5,
        unitCost: 150,
        subtotalCost: 750,
        availableStock: 500,
      },
      {
        id: "ing-205",
        productId: "prod-2",
        stockId: "mat-5",
        stockName: "Susu Bubuk Full Cream",
        baseUnit: "g",
        quantity: 20,
        unitCost: 65,
        subtotalCost: 1300,
        availableStock: 2500,
      },
      {
        id: "ing-206",
        productId: "prod-2",
        stockId: "mat-8",
        stockName: "Telur Ayam Segar",
        baseUnit: "g",
        quantity: 40,
        unitCost: 28,
        subtotalCost: 1120,
        availableStock: 4000,
      },
      {
        id: "ing-207",
        productId: "prod-2",
        stockId: "mat-10",
        stockName: "Garam Halus",
        baseUnit: "g",
        quantity: 4,
        unitCost: 5,
        subtotalCost: 20,
        availableStock: 3000,
      },
    ],
    batches: [
      {
        id: "batch-201",
        batchNumber: "B-20240511-01",
        initialQuantity: 20,
        remainingQuantity: 18,
        hppAtProduction: 8450,
        productionDate: "2024-05-11T07:15:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "prod-3",
    name: "Butter Croissant Klasik",
    category: "Pastry & Cake",
    unit: "pcs",
    sellingPrice: 22000,
    currentStock: 12,
    latestHpp: 9800,
    minStock: 8,
    description: "Croissant berlapis renyah keemasan di luar dan lembut wangi butter di dalam.",
    createdAt: "2024-03-10T11:00:00Z",
    updatedAt: "2024-05-09T11:20:00Z",
    ingredients: [
      {
        id: "ing-301",
        productId: "prod-3",
        stockId: "mat-1",
        stockName: "Tepung Terigu Protein Tinggi",
        baseUnit: "g",
        quantity: 110,
        unitCost: 12,
        subtotalCost: 1320,
        availableStock: 12000,
      },
      {
        id: "ing-302",
        productId: "prod-3",
        stockId: "mat-6",
        stockName: "Mentega / Butter",
        baseUnit: "g",
        quantity: 65,
        unitCost: 35,
        subtotalCost: 2275,
        availableStock: 2000,
      },
      {
        id: "ing-303",
        productId: "prod-3",
        stockId: "mat-3",
        stockName: "Gula Pasir Kristal",
        baseUnit: "g",
        quantity: 12,
        unitCost: 14.5,
        subtotalCost: 174,
        availableStock: 10000,
      },
      {
        id: "ing-304",
        productId: "prod-3",
        stockId: "mat-4",
        stockName: "Ragi Instan (Yeast)",
        baseUnit: "g",
        quantity: 3,
        unitCost: 150,
        subtotalCost: 450,
        availableStock: 500,
      },
      {
        id: "ing-305",
        productId: "prod-3",
        stockId: "mat-5",
        stockName: "Susu Bubuk Full Cream",
        baseUnit: "g",
        quantity: 15,
        unitCost: 65,
        subtotalCost: 975,
        availableStock: 2500,
      },
      {
        id: "ing-306",
        productId: "prod-3",
        stockId: "mat-8",
        stockName: "Telur Ayam Segar",
        baseUnit: "g",
        quantity: 20,
        unitCost: 28,
        subtotalCost: 560,
        availableStock: 4000,
      },
    ],
    batches: [
      {
        id: "batch-301",
        batchNumber: "B-20240509-01",
        initialQuantity: 15,
        remainingQuantity: 12,
        hppAtProduction: 9800,
        productionDate: "2024-05-09T06:45:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "prod-4",
    name: "Donat Kentang Gula Halus",
    category: "Donat",
    unit: "pcs",
    sellingPrice: 6500,
    currentStock: 60,
    latestHpp: 2150,
    minStock: 20,
    description: "Donat kentang tradisional super empuk dengan taburan gula icing dingin.",
    createdAt: "2024-03-15T09:30:00Z",
    updatedAt: "2024-05-12T10:00:00Z",
    ingredients: [
      {
        id: "ing-401",
        productId: "prod-4",
        stockId: "mat-1",
        stockName: "Tepung Terigu Protein Tinggi",
        baseUnit: "g",
        quantity: 45,
        unitCost: 12,
        subtotalCost: 540,
        availableStock: 12000,
      },
      {
        id: "ing-402",
        productId: "prod-4",
        stockId: "mat-3",
        stockName: "Gula Pasir Kristal",
        baseUnit: "g",
        quantity: 15,
        unitCost: 14.5,
        subtotalCost: 217.5,
        availableStock: 10000,
      },
      {
        id: "ing-403",
        productId: "prod-4",
        stockId: "mat-2",
        stockName: "Minyak Goreng Sawit",
        baseUnit: "ml",
        quantity: 15,
        unitCost: 16,
        subtotalCost: 240,
        availableStock: 5000,
      },
      {
        id: "ing-404",
        productId: "prod-4",
        stockId: "mat-6",
        stockName: "Mentega / Butter",
        baseUnit: "g",
        quantity: 8,
        unitCost: 35,
        subtotalCost: 280,
        availableStock: 2000,
      },
      {
        id: "ing-405",
        productId: "prod-4",
        stockId: "mat-4",
        stockName: "Ragi Instan (Yeast)",
        baseUnit: "g",
        quantity: 2,
        unitCost: 150,
        subtotalCost: 300,
        availableStock: 500,
      },
      {
        id: "ing-406",
        productId: "prod-4",
        stockId: "mat-8",
        stockName: "Telur Ayam Segar",
        baseUnit: "g",
        quantity: 10,
        unitCost: 28,
        subtotalCost: 280,
        availableStock: 4000,
      },
    ],
    batches: [
      {
        id: "batch-401",
        batchNumber: "B-20240512-01",
        initialQuantity: 60,
        remainingQuantity: 60,
        hppAtProduction: 2150,
        productionDate: "2024-05-12T06:00:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "prod-5",
    name: "Bolu Gulung Keju Spesial",
    category: "Pastry & Cake",
    unit: "roll",
    sellingPrice: 48000,
    currentStock: 6,
    latestHpp: 22400,
    minStock: 5,
    description: "Bolu gulung lembut dengan buttercream premium dan taburan keju cheddar parut melimpah.",
    createdAt: "2024-03-20T13:00:00Z",
    updatedAt: "2024-05-11T12:00:00Z",
    ingredients: [
      {
        id: "ing-501",
        productId: "prod-5",
        stockId: "mat-1",
        stockName: "Tepung Terigu Protein Tinggi",
        baseUnit: "g",
        quantity: 100,
        unitCost: 12,
        subtotalCost: 1200,
        availableStock: 12000,
      },
      {
        id: "ing-502",
        productId: "prod-5",
        stockId: "mat-3",
        stockName: "Gula Pasir Kristal",
        baseUnit: "g",
        quantity: 90,
        unitCost: 14.5,
        subtotalCost: 1305,
        availableStock: 10000,
      },
      {
        id: "ing-503",
        productId: "prod-5",
        stockId: "mat-8",
        stockName: "Telur Ayam Segar",
        baseUnit: "g",
        quantity: 180,
        unitCost: 28,
        subtotalCost: 5040,
        availableStock: 4000,
      },
      {
        id: "ing-504",
        productId: "prod-5",
        stockId: "mat-6",
        stockName: "Mentega / Butter",
        baseUnit: "g",
        quantity: 80,
        unitCost: 35,
        subtotalCost: 2800,
        availableStock: 2000,
      },
      {
        id: "ing-505",
        productId: "prod-5",
        stockId: "mat-5",
        stockName: "Susu Bubuk Full Cream",
        baseUnit: "g",
        quantity: 25,
        unitCost: 65,
        subtotalCost: 1625,
        availableStock: 2500,
      },
      {
        id: "ing-506",
        productId: "prod-5",
        stockId: "mat-9",
        stockName: "Keju Cheddar Olahan",
        baseUnit: "g",
        quantity: 80,
        unitCost: 75,
        subtotalCost: 6000,
        availableStock: 1800,
      },
    ],
    batches: [
      {
        id: "batch-501",
        batchNumber: "B-20240511-03",
        initialQuantity: 8,
        remainingQuantity: 6,
        hppAtProduction: 22400,
        productionDate: "2024-05-11T11:00:00Z",
        status: "active",
      },
    ],
  },
];

export const recipeService = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return [...LOCAL_PRODUCTS];
    } catch {
      return [...LOCAL_PRODUCTS];
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch {
      const found = LOCAL_PRODUCTS.find((p) => p.id === id);
      if (!found) {
        throw new Error('Produk/Resep tidak ditemukan');
      }
      return found;
    }
  },

  createProduct: async (data: CreateProductInput): Promise<Product> => {
    try {
      const response = await apiClient.post<Product>('/products', data);
      return response.data;
    } catch {
      const newIngredients: RecipeIngredient[] = [];
      if (data.initialIngredients && data.initialIngredients.length > 0) {
        for (const item of data.initialIngredients) {
          const mat = AVAILABLE_MATERIALS.find((m) => m.id === item.stockId);
          if (mat) {
            newIngredients.push({
              id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              productId: `prod-${Date.now()}`,
              stockId: mat.id,
              stockName: mat.name,
              baseUnit: mat.baseUnit,
              quantity: item.quantity,
              unitCost: mat.avgCostPerUnit,
              subtotalCost: item.quantity * mat.avgCostPerUnit,
              availableStock: mat.currentStock,
            });
          }
        }
      }

      const totalIngCost = newIngredients.reduce((acc, curr) => acc + curr.subtotalCost, 0);
      const estHpp = totalIngCost > 0 ? totalIngCost * 1.15 : 0;
      const margin = data.targetMargin || 50;
      const calculatedSellingPrice = data.sellingPrice && data.sellingPrice > 0
        ? Number(data.sellingPrice)
        : (estHpp > 0 && margin < 100 ? Math.ceil((estHpp / (1 - margin / 100)) / 500) * 500 : 10000);

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: data.name,
        category: data.category || "Roti",
        unit: data.unit || "pcs",
        sellingPrice: calculatedSellingPrice,
        targetMargin: margin,
        currentStock: 0,
        latestHpp: estHpp, // Estimasi awal HPP (+15% overhead)
        minStock: Number(data.minStock) || 10,
        description: data.description || "",
        createdAt: new Date().toISOString(),
        ingredients: newIngredients,
        batches: [],
      };

      LOCAL_PRODUCTS = [newProduct, ...LOCAL_PRODUCTS];
      return newProduct;
    }
  },

  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    try {
      const response = await apiClient.put<Product>(`/products/${id}`, data);
      return response.data;
    } catch {
      const index = LOCAL_PRODUCTS.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error('Produk tidak ditemukan');
      }

      const existing = LOCAL_PRODUCTS[index];
      const updated: Product = {
        ...existing,
        ...data,
        sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : existing.sellingPrice,
        minStock: data.minStock !== undefined ? Number(data.minStock) : existing.minStock,
        currentStock: data.currentStock !== undefined ? Number(data.currentStock) : existing.currentStock,
        updatedAt: new Date().toISOString(),
      };

      LOCAL_PRODUCTS[index] = updated;
      return updated;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      LOCAL_PRODUCTS = LOCAL_PRODUCTS.filter((p) => p.id !== id);
    }
  },

  addIngredient: async (productId: string, data: AddIngredientInput): Promise<Product> => {
    try {
      const response = await apiClient.post<Product>(`/products/${productId}/recipe`, data);
      return response.data;
    } catch {
      const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
      if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

      const mat = AVAILABLE_MATERIALS.find((m) => m.id === data.stockId);
      if (!mat) throw new Error('Bahan baku tidak valid');

      const prod = { ...LOCAL_PRODUCTS[prodIndex] };
      const existingIngIndex = prod.ingredients.findIndex((ing) => ing.stockId === data.stockId);

      const qty = Number(data.quantity);
      if (existingIngIndex > -1) {
        // Update existing ingredient
        const existing = prod.ingredients[existingIngIndex];
        const newQty = existing.quantity + qty;
        prod.ingredients[existingIngIndex] = {
          ...existing,
          quantity: newQty,
          subtotalCost: newQty * existing.unitCost,
        };
      } else {
        // Add new ingredient
        prod.ingredients = [
          ...prod.ingredients,
          {
            id: `ing-${Date.now()}`,
            productId,
            stockId: mat.id,
            stockName: mat.name,
            baseUnit: mat.baseUnit,
            quantity: qty,
            unitCost: mat.avgCostPerUnit,
            subtotalCost: qty * mat.avgCostPerUnit,
            availableStock: mat.currentStock,
          },
        ];
      }

      LOCAL_PRODUCTS[prodIndex] = prod;
      return prod;
    }
  },

  updateIngredientQuantity: async (productId: string, ingredientId: string, quantity: number): Promise<Product> => {
    const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
    if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

    const prod = { ...LOCAL_PRODUCTS[prodIndex] };
    const ingIndex = prod.ingredients.findIndex((ing) => ing.id === ingredientId);
    if (ingIndex === -1) throw new Error('Bahan resep tidak ditemukan');

    const ing = prod.ingredients[ingIndex];
    prod.ingredients[ingIndex] = {
      ...ing,
      quantity,
      subtotalCost: quantity * ing.unitCost,
    };

    LOCAL_PRODUCTS[prodIndex] = prod;
    return prod;
  },

  removeIngredient: async (productId: string, ingredientId: string): Promise<Product> => {
    try {
      await apiClient.delete(`/products/${productId}/recipe/${ingredientId}`);
    } catch {
      // Local fallback
    }

    const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
    if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

    const prod = { ...LOCAL_PRODUCTS[prodIndex] };
    prod.ingredients = prod.ingredients.filter((ing) => ing.id !== ingredientId);
    LOCAL_PRODUCTS[prodIndex] = prod;
    return prod;
  },

  getAvailableMaterials: async (): Promise<RawMaterialStock[]> => {
    return [...AVAILABLE_MATERIALS];
  },
};
