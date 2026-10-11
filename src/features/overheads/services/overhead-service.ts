import apiClient from '@/lib/api-client';
import type {
  OverheadType,
  OverheadCategory,
  CreateOverheadInput,
  UpdateOverheadInput,
  OverheadQuery,
  PaginatedOverheads,
} from '../types';

interface PaginatedOverheadRawResponse {
  items: OverheadRawResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Raw backend shape (snake_case)
interface OverheadRawResponse {
  id: string;
  store_id: string;
  name: string;
  category: OverheadType['category'];
  default_amount: number | string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapRawToOverhead = (raw: OverheadRawResponse): OverheadType => ({
  id: raw.id,
  storeId: raw.store_id,
  name: raw.name,
  category: raw.category || 'PRODUCTION',
  defaultAmount: raw.default_amount !== null && raw.default_amount !== undefined
    ? Number(raw.default_amount)
    : null,
  notes: raw.notes || '',
  isActive: Boolean(raw.is_active),
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

// In-memory fallback mock storage when backend endpoint is not yet connected/empty
const LOCAL_STORAGE_KEY = 'hpp_mock_overheads_data';

const getMockData = (): OverheadType[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore json parse error
  }
  return [];
};

const saveMockData = (data: OverheadType[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore local storage error
  }
};

export const overheadService = {
  getPaginatedOverheads: async (query?: OverheadQuery): Promise<PaginatedOverheads> => {
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.activeOnly !== undefined) params.append('active_only', query.activeOnly.toString());
      if (query?.category) params.append('category', query.category);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<PaginatedOverheadRawResponse | OverheadRawResponse[]>(`/overheads${qs}`);
      const rawData = response.data;
      if (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray(rawData.items)) {
        return {
          items: rawData.items.map(mapRawToOverhead),
          total: rawData.total,
          page: rawData.page,
          limit: rawData.limit,
          totalPages: rawData.total_pages,
        };
      }
      if (Array.isArray(rawData)) {
        const mapped = rawData.map(mapRawToOverhead);
        return {
          items: mapped,
          total: mapped.length,
          page: 1,
          limit: mapped.length || 10,
          totalPages: 1,
        };
      }
      return {
        items: [],
        total: 0,
        page: query?.page || 1,
        limit: query?.limit || 10,
        totalPages: 0,
      };
    } catch {
      let mock = getMockData();
      if (query?.activeOnly !== undefined) {
        mock = mock.filter((item) => item.isActive === query.activeOnly);
      }
      if (query?.category) {
        mock = mock.filter((item) => item.category === query.category);
      }
      if (query?.search) {
        const s = query.search.toLowerCase();
        mock = mock.filter(
          (item) => item.name.toLowerCase().includes(s) || item.notes.toLowerCase().includes(s)
        );
      }
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const total = mock.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const items = mock.slice((page - 1) * limit, page * limit);
      return {
        items,
        total,
        page,
        limit,
        totalPages,
      };
    }
  },

  getOverheads: async (query?: { activeOnly?: boolean; category?: OverheadCategory }): Promise<OverheadType[]> => {
    try {
      const params = new URLSearchParams();
      if (query?.activeOnly !== undefined) params.append('active_only', query.activeOnly.toString());
      if (query?.category) params.append('category', query.category);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<OverheadRawResponse[] | { items: OverheadRawResponse[] }>(`/overheads${qs}`);
      const rawData = response.data;
      let items: OverheadRawResponse[] = [];
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray(rawData.items)) {
        items = rawData.items;
      }
      let result = items.map(mapRawToOverhead);
      if (result.length > 0) {
        if (query?.activeOnly !== undefined) {
          result = result.filter((item) => item.isActive === query.activeOnly);
        }
        if (query?.category) {
          result = result.filter((item) => item.category === query.category);
        }
        return result;
      }
      // If backend returns empty array or doesn't have data, return mock/local fallback
      let mock = getMockData();
      if (query?.activeOnly !== undefined) mock = mock.filter((item) => item.isActive === query.activeOnly);
      if (query?.category) mock = mock.filter((item) => item.category === query.category);
      return mock;
    } catch {
      // Backend unavailable or 404, fallback to local storage
      let mock = getMockData();
      if (query?.activeOnly !== undefined) mock = mock.filter((item) => item.isActive === query.activeOnly);
      if (query?.category) mock = mock.filter((item) => item.category === query.category);
      return mock;
    }
  },

  createOverhead: async (input: CreateOverheadInput): Promise<OverheadType> => {
    const payload = {
      name: input.name,
      category: input.category,
      default_amount: input.defaultAmount ?? null,
      notes: input.notes || '',
      is_active: input.isActive ?? true,
    };

    try {
      const response = await apiClient.post<OverheadRawResponse>('/overheads', payload);
      const created = mapRawToOverhead(response.data);
      const current = getMockData();
      saveMockData([created, ...current]);
      return created;
    } catch {
      // Local fallback creation
      const created: OverheadType = {
        id: `mock-oh-${Date.now()}`,
        storeId: 'default-store',
        name: input.name,
        category: input.category,
        defaultAmount: input.defaultAmount ?? null,
        notes: input.notes || '',
        isActive: input.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const current = getMockData();
      saveMockData([created, ...current]);
      return created;
    }
  },

  updateOverhead: async (id: string, input: UpdateOverheadInput): Promise<OverheadType> => {
    const payload = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.defaultAmount !== undefined && { default_amount: input.defaultAmount }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    };

    try {
      const response = await apiClient.put<OverheadRawResponse>(`/overheads/${id}`, payload);
      const updated = mapRawToOverhead(response.data);
      const current = getMockData();
      saveMockData(current.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch {
      const current = getMockData();
      const existing = current.find((item) => item.id === id);
      const updated: OverheadType = {
        id,
        storeId: existing?.storeId || 'default-store',
        name: input.name ?? existing?.name ?? 'Overhead',
        category: input.category ?? existing?.category ?? 'PRODUCTION',
        defaultAmount: input.defaultAmount !== undefined ? input.defaultAmount : (existing?.defaultAmount ?? null),
        notes: input.notes !== undefined ? input.notes : (existing?.notes ?? ''),
        isActive: input.isActive !== undefined ? input.isActive : (existing?.isActive ?? true),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveMockData(current.map((item) => (item.id === id ? updated : item)));
      return updated;
    }
  },

  deleteOverhead: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/overheads/${id}`);
    } catch {
      // continue to remove from mock
    }
    const current = getMockData();
    saveMockData(current.filter((item) => item.id !== id));
  },

  applyTemplate: async (): Promise<OverheadType[]> => {
    try {
      const response = await apiClient.post<OverheadRawResponse[]>('/overheads/apply-template', {});
      const items = Array.isArray(response.data) ? response.data : [];
      if (items.length > 0) {
        const mapped = items.map(mapRawToOverhead);
        saveMockData(mapped);
        return mapped;
      }
    } catch {
      // Backend not yet ready, load default template
    }

    const defaultTemplates: OverheadType[] = [
      {
        id: `mock-gas-${Date.now()}`,
        storeId: 'default-store',
        name: 'Gas Elpiji',
        category: 'PRODUCTION',
        defaultAmount: 15000,
        notes: 'Alokasi tabung gas melon/bright gas per sesi batch memasak',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `mock-listrik-${Date.now() + 1}`,
        storeId: 'default-store',
        name: 'Listrik Operasional',
        category: 'PRODUCTION',
        defaultAmount: 5000,
        notes: 'Konsumsi daya mixer, oven, blender & chiller per jam jalan',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `mock-sdm-${Date.now() + 2}`,
        storeId: 'default-store',
        name: 'Tenaga Kerja Masak',
        category: 'PRODUCTION',
        defaultAmount: 20000,
        notes: 'Upah kerja kitchen per jam proses produksi',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `mock-sewa-${Date.now() + 3}`,
        storeId: 'default-store',
        name: 'Sewa Tempat & Utilitas',
        category: 'OPERATIONAL',
        defaultAmount: 1500000,
        notes: 'Biaya sewa outlet/dapur produksi rutin bulanan',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const current = getMockData();
    // Merge without duplicating names
    const existingNames = new Set(current.map((c) => c.name.toLowerCase()));
    const newItems = defaultTemplates.filter((t) => !existingNames.has(t.name.toLowerCase()));
    const merged = [...current, ...newItems];
    saveMockData(merged);
    return merged;
  },
};
