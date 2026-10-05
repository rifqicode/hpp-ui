import apiClient from '../../../lib/api-client';
import { recipeService } from '../../recipes/services/recipe-service';
import type {
  ProductionBatch,
  StartProductionInput,
  CompleteProductionInput,
  ConsumedIngredient,
} from '../types';

let LOCAL_BATCHES: ProductionBatch[] = [
  {
    id: "batch-act-1",
    batchNumber: "B-20240512-03",
    productId: "prod-1",
    productName: "Roti Manis Coklat Lumer",
    productCategory: "Roti",
    productUnit: "pcs",
    sellingPrice: 8500,
    status: "IN_PROGRESS",
    targetQuantity: 50,
    stockCost: 163650, // 50 * Rp 3.273
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
    notes: "Batch sore untuk display toko etalase depan.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 2500, cost: 30000 },
      { stockId: "mat-3", stockName: "Gula Pasir Kristal", baseUnit: "g", quantity: 750, cost: 10875 },
      { stockId: "mat-6", stockName: "Mentega / Butter", baseUnit: "g", quantity: 500, cost: 17500 },
      { stockId: "mat-4", stockName: "Ragi Instan (Yeast)", baseUnit: "g", quantity: 100, cost: 15000 },
      { stockId: "mat-5", stockName: "Susu Bubuk Full Cream", baseUnit: "g", quantity: 250, cost: 16250 },
      { stockId: "mat-7", stockName: "Coklat Bubuk Premium", baseUnit: "g", quantity: 750, cost: 60000 },
      { stockId: "mat-8", stockName: "Telur Ayam Segar", baseUnit: "g", quantity: 500, cost: 14000 },
    ],
  },
  {
    id: "batch-act-2",
    batchNumber: "B-20240512-04",
    productId: "prod-3",
    productName: "Butter Croissant Klasik",
    productCategory: "Pastry & Cake",
    productUnit: "pcs",
    sellingPrice: 22000,
    status: "IN_PROGRESS",
    targetQuantity: 30,
    stockCost: 171450, // 30 * Rp 5.715
    startedAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(), // 80 mins ago
    notes: "Proses laminasi butter sheet layer kedua.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 3300, cost: 39600 },
      { stockId: "mat-6", stockName: "Mentega / Butter", baseUnit: "g", quantity: 1950, cost: 68250 },
      { stockId: "mat-3", stockName: "Gula Pasir Kristal", baseUnit: "g", quantity: 360, cost: 5220 },
      { stockId: "mat-4", stockName: "Ragi Instan (Yeast)", baseUnit: "g", quantity: 90, cost: 13500 },
      { stockId: "mat-5", stockName: "Susu Bubuk Full Cream", baseUnit: "g", quantity: 450, cost: 29250 },
      { stockId: "mat-8", stockName: "Telur Ayam Segar", baseUnit: "g", quantity: 600, cost: 16800 },
    ],
  },
  {
    id: "batch-act-3",
    batchNumber: "B-20240512-05",
    productId: "prod-4",
    productName: "Donat Kentang Gula Halus",
    productCategory: "Donat",
    productUnit: "pcs",
    sellingPrice: 6500,
    status: "IN_PROGRESS",
    targetQuantity: 80,
    stockCost: 149600, // 80 * Rp 1.870
    startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    notes: "Proses proofing tahap 1.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 3600, cost: 43200 },
      { stockId: "mat-3", stockName: "Gula Pasir Kristal", baseUnit: "g", quantity: 1200, cost: 17400 },
      { stockId: "mat-2", stockName: "Minyak Goreng Sawit", baseUnit: "ml", quantity: 1200, cost: 19200 },
      { stockId: "mat-6", stockName: "Mentega / Butter", baseUnit: "g", quantity: 640, cost: 22400 },
      { stockId: "mat-4", stockName: "Ragi Instan (Yeast)", baseUnit: "g", quantity: 160, cost: 24000 },
      { stockId: "mat-8", stockName: "Telur Ayam Segar", baseUnit: "g", quantity: 800, cost: 22400 },
    ],
  },
  {
    id: "batch-comp-1",
    batchNumber: "B-20240512-01",
    productId: "prod-4",
    productName: "Donat Kentang Gula Halus",
    productCategory: "Donat",
    productUnit: "pcs",
    sellingPrice: 6500,
    status: "COMPLETED",
    targetQuantity: 60,
    goodQuantity: 58,
    wasteQuantity: 2,
    stockCost: 112200,
    overheadCost: 12500,
    overheadBreakdown: { labor: 5000, energy: 4500, packaging: 3000 },
    totalCost: 124700,
    hppPerUnit: 2150, // 124700 / 58
    startedAt: "2024-05-12T05:30:00Z",
    completedAt: "2024-05-12T07:10:00Z",
    notes: "2 pcs gagal karena minyak terlalu panas.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 2700, cost: 32400 },
      { stockId: "mat-3", stockName: "Gula Pasir Kristal", baseUnit: "g", quantity: 900, cost: 13050 },
      { stockId: "mat-2", stockName: "Minyak Goreng Sawit", baseUnit: "ml", quantity: 900, cost: 14400 },
      { stockId: "mat-6", stockName: "Mentega / Butter", baseUnit: "g", quantity: 480, cost: 16800 },
      { stockId: "mat-4", stockName: "Ragi Instan (Yeast)", baseUnit: "g", quantity: 120, cost: 18000 },
      { stockId: "mat-8", stockName: "Telur Ayam Segar", baseUnit: "g", quantity: 600, cost: 16800 },
    ],
  },
  {
    id: "batch-comp-2",
    batchNumber: "B-20240511-03",
    productId: "prod-5",
    productName: "Bolu Gulung Keju Spesial",
    productCategory: "Pastry & Cake",
    productUnit: "roll",
    sellingPrice: 48000,
    status: "COMPLETED",
    targetQuantity: 8,
    goodQuantity: 8,
    wasteQuantity: 0,
    stockCost: 143760,
    overheadCost: 35440,
    overheadBreakdown: { labor: 15000, energy: 12000, packaging: 8440 },
    totalCost: 179200,
    hppPerUnit: 22400,
    startedAt: "2024-05-11T09:00:00Z",
    completedAt: "2024-05-11T11:00:00Z",
    notes: "Yield sempurna, tekstur bolu sangat lembut.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 800, cost: 9600 },
      { stockId: "mat-3", stockName: "Gula Pasir Kristal", baseUnit: "g", quantity: 720, cost: 10440 },
      { stockId: "mat-8", stockName: "Telur Ayam Segar", baseUnit: "g", quantity: 1440, cost: 40320 },
      { stockId: "mat-6", stockName: "Mentega / Butter", baseUnit: "g", quantity: 640, cost: 22400 },
      { stockId: "mat-5", stockName: "Susu Bubuk Full Cream", baseUnit: "g", quantity: 200, cost: 13000 },
      { stockId: "mat-9", stockName: "Keju Cheddar Olahan", baseUnit: "g", quantity: 640, cost: 48000 },
    ],
  },
  {
    id: "batch-comp-3",
    batchNumber: "B-20240511-01",
    productId: "prod-2",
    productName: "Roti Tawar Gandum Premium",
    productCategory: "Roti",
    productUnit: "loaf",
    sellingPrice: 18000,
    status: "COMPLETED",
    targetQuantity: 20,
    goodQuantity: 19,
    wasteQuantity: 1,
    stockCost: 130750,
    overheadCost: 29800,
    overheadBreakdown: { labor: 12000, energy: 11000, packaging: 6800 },
    totalCost: 160550,
    hppPerUnit: 8450,
    startedAt: "2024-05-11T05:00:00Z",
    completedAt: "2024-05-11T07:15:00Z",
    notes: "1 loaf bentuk kurang simetris dipotong untuk tester pengunjung.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 5200, cost: 62400 },
      { stockId: "mat-3", stockName: "Gula Pasir Kristal", baseUnit: "g", quantity: 500, cost: 7250 },
      { stockId: "mat-6", stockName: "Mentega / Butter", baseUnit: "g", quantity: 700, cost: 24500 },
      { stockId: "mat-4", stockName: "Ragi Instan (Yeast)", baseUnit: "g", quantity: 100, cost: 15000 },
      { stockId: "mat-5", stockName: "Susu Bubuk Full Cream", baseUnit: "g", quantity: 400, cost: 26000 },
      { stockId: "mat-8", stockName: "Telur Ayam Segar", baseUnit: "g", quantity: 800, cost: 22400 },
    ],
  },
  {
    id: "batch-canc-1",
    batchNumber: "B-20240509-02",
    productId: "prod-2",
    productName: "Roti Tawar Gandum Premium",
    productCategory: "Roti",
    productUnit: "loaf",
    sellingPrice: 18000,
    status: "CANCELLED",
    targetQuantity: 20,
    stockCost: 130750,
    startedAt: "2024-05-09T14:00:00Z",
    completedAt: "2024-05-09T14:20:00Z",
    notes: "Dibatalkan: Listrik padam mendadak sebelum adonan masuk oven, stok bahan dikembalikan.",
    ingredients: [
      { stockId: "mat-1", stockName: "Tepung Terigu Protein Tinggi", baseUnit: "g", quantity: 5200, cost: 62400 },
    ],
  },
];

export const productionService = {
  getBatches: async (): Promise<ProductionBatch[]> => {
    try {
      const response = await apiClient.get<ProductionBatch[]>('/production');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return [...LOCAL_BATCHES];
    } catch {
      return [...LOCAL_BATCHES];
    }
  },

  getBatchById: async (id: string): Promise<ProductionBatch> => {
    try {
      const response = await apiClient.get<ProductionBatch>(`/production/${id}`);
      return response.data;
    } catch {
      const found = LOCAL_BATCHES.find((b) => b.id === id);
      if (!found) {
        throw new Error('Batch produksi tidak ditemukan');
      }
      return found;
    }
  },

  startProduction: async (input: StartProductionInput): Promise<ProductionBatch> => {
    try {
      const response = await apiClient.post<ProductionBatch>('/production/start', input);
      return response.data;
    } catch {
      const product = await recipeService.getProductById(input.productId);
      if (!product) throw new Error('Produk tidak valid');

      const consumedIngredients: ConsumedIngredient[] = product.ingredients.map((ing) => ({
        stockId: ing.stockId,
        stockName: ing.stockName,
        baseUnit: ing.baseUnit,
        quantity: ing.quantity * input.targetQuantity,
        cost: ing.subtotalCost * input.targetQuantity,
      }));

      const totalStockCost = consumedIngredients.reduce((acc, curr) => acc + curr.cost, 0);

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = LOCAL_BATCHES.filter((b) => b.batchNumber.includes(dateStr)).length + 1;
      const batchNumber = `B-${dateStr}-${countToday < 10 ? '0' + countToday : countToday}`;

      const newBatch: ProductionBatch = {
        id: `batch-${Date.now()}`,
        batchNumber,
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productUnit: product.unit,
        sellingPrice: product.sellingPrice,
        status: 'IN_PROGRESS',
        targetQuantity: input.targetQuantity,
        stockCost: totalStockCost,
        startedAt: now.toISOString(),
        notes: input.notes || "",
        ingredients: consumedIngredients,
      };

      LOCAL_BATCHES = [newBatch, ...LOCAL_BATCHES];
      return newBatch;
    }
  },

  completeProduction: async (id: string, input: CompleteProductionInput): Promise<ProductionBatch> => {
    try {
      const response = await apiClient.post<ProductionBatch>(`/production/${id}/complete`, input);
      return response.data;
    } catch {
      const index = LOCAL_BATCHES.findIndex((b) => b.id === id);
      if (index === -1) throw new Error('Batch tidak ditemukan');

      const batch = { ...LOCAL_BATCHES[index] };
      if (batch.status !== 'IN_PROGRESS') {
        throw new Error('Hanya batch berstatus IN_PROGRESS yang dapat diselesaikan');
      }

      if (input.goodQuantity <= 0) {
        throw new Error('Jumlah barang bagus harus lebih dari 0');
      }

      const overheadTotal =
        (input.overheadLabor || 0) +
        (input.overheadEnergy || 0) +
        (input.overheadPackaging || 0) +
        (input.overheadOther || 0);

      const totalCost = batch.stockCost + overheadTotal;
      const hppPerUnit = Math.round(totalCost / input.goodQuantity);

      const completed: ProductionBatch = {
        ...batch,
        status: 'COMPLETED',
        goodQuantity: input.goodQuantity,
        wasteQuantity: input.wasteQuantity || 0,
        overheadCost: overheadTotal,
        overheadBreakdown: {
          labor: input.overheadLabor || 0,
          energy: input.overheadEnergy || 0,
          packaging: input.overheadPackaging || 0,
          other: input.overheadOther || 0,
        },
        totalCost,
        hppPerUnit,
        completedAt: new Date().toISOString(),
        notes: input.notes ? `${batch.notes || ''} | ${input.notes}`.trim() : batch.notes,
      };

      LOCAL_BATCHES[index] = completed;

      // Update product current stock and latest HPP
      try {
        const prod = await recipeService.getProductById(batch.productId);
        if (prod) {
          await recipeService.updateProduct(batch.productId, {
            sellingPrice: prod.sellingPrice,
          });
          prod.currentStock += input.goodQuantity;
          prod.latestHpp = hppPerUnit;
        }
      } catch {
        // silent sync
      }

      return completed;
    }
  },

  cancelProduction: async (id: string, reason?: string): Promise<ProductionBatch> => {
    try {
      const response = await apiClient.post<ProductionBatch>(`/production/${id}/cancel`, { reason });
      return response.data;
    } catch {
      const index = LOCAL_BATCHES.findIndex((b) => b.id === id);
      if (index === -1) throw new Error('Batch tidak ditemukan');

      const batch = { ...LOCAL_BATCHES[index] };
      const cancelled: ProductionBatch = {
        ...batch,
        status: 'CANCELLED',
        completedAt: new Date().toISOString(),
        notes: reason ? `${batch.notes || ''} | Batal: ${reason}`.trim() : batch.notes,
      };

      LOCAL_BATCHES[index] = cancelled;
      return cancelled;
    }
  },
};
