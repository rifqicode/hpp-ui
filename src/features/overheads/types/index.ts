export type OverheadCategory = 'OPERATIONAL' | 'PRODUCTION';

export interface OverheadType {
  id: string;
  storeId: string;
  name: string;
  category: OverheadCategory;
  defaultAmount: number | null;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOverheadInput {
  name: string;
  category: OverheadCategory;
  defaultAmount?: number | null;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateOverheadInput {
  name?: string;
  category?: OverheadCategory;
  defaultAmount?: number | null;
  notes?: string;
  isActive?: boolean;
}

export interface OverheadQuery {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
  category?: OverheadCategory;
  sortBy?: string;
  sort_by?: string;
}

export interface PaginatedOverheads {
  items: OverheadType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OverheadSummary {
  total_overheads: number;
  active_count: number;
  inactive_count: number;
  production_count: number;
  operational_count: number;
}

export interface OverheadCategoryMeta {
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  badgeColorClass: string;
}

export const OVERHEAD_CATEGORIES: Record<OverheadCategory, OverheadCategoryMeta> = {
  OPERATIONAL: {
    label: 'Biaya Operasional',
    shortLabel: 'Operasional',
    unit: 'Rp',
    description: 'Biaya utilitas & operasional toko (sewa, listrik toko, internet bulanan)',
    badgeVariant: 'secondary',
    badgeColorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  PRODUCTION: {
    label: 'Biaya Produksi',
    shortLabel: 'Produksi',
    unit: 'Rp',
    description: 'Biaya proses batch produksi (gas LPG, upah masak, kemasan)',
    badgeVariant: 'secondary',
    badgeColorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
};
