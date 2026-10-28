import type { Promotion, PromotionType } from '../types';

export type PromotionStatusFilter = 'all' | 'active' | 'inactive' | 'scheduled' | 'ended';
export type PromotionTypeFilter = 'all' | PromotionType;
export type PromotionAttentionFilter = 'all' | 'active' | 'budget' | 'attention';

export const PROMO_SORTS = {
  'name-asc': 'Nama A–Z',
  'name-desc': 'Nama Z–A',
  'created-desc': 'Terbaru',
  'budget-desc': 'Anggaran Terbesar',
} as const;

export type PromotionSort = keyof typeof PROMO_SORTS;

export interface PromotionListFilters {
  status: PromotionStatusFilter;
  type: PromotionTypeFilter;
  attention: PromotionAttentionFilter;
  sort: PromotionSort;
}

export type PromotionOperationalStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'ENDED';

export function getPromotionOperationalStatus(promotion: Promotion): PromotionOperationalStatus {
  if (!promotion.is_active) return 'INACTIVE';
  const now = new Date();
  if (promotion.start_at && new Date(promotion.start_at) > now) return 'SCHEDULED';
  if (promotion.end_at && new Date(promotion.end_at) <= now) return 'ENDED';
  return 'ACTIVE';
}

export function isPromotionAttention(promotion: Promotion): boolean {
  if (promotion.planning_snapshot?.health_status === 'MARGIN_DEFICIT') return true;
  const budget = Number(promotion.promo_budget);
  if (budget > 0) {
    const spent = Number(promotion.budget_spent);
    if (spent / budget >= 0.9) return true;
  }
  return false;
}

export function getPromotionMetrics(promotions: Promotion[]) {
  let activeCount = 0;
  let totalBudgetSpent = 0;
  let attentionCount = 0;

  for (const promo of promotions) {
    const status = getPromotionOperationalStatus(promo);
    if (status === 'ACTIVE') activeCount++;
    totalBudgetSpent += Number(promo.budget_spent) || 0;
    if (isPromotionAttention(promo)) attentionCount++;
  }

  return {
    total: promotions.length,
    active: activeCount,
    budgetSpent: totalBudgetSpent,
    attention: attentionCount,
  };
}

export function filterPromotions(
  promotions: Promotion[],
  search: string,
  status: PromotionStatusFilter,
  type: PromotionTypeFilter,
  attention: PromotionAttentionFilter,
  sort: PromotionSort
): Promotion[] {
  const term = search.trim().toLowerCase();

  const filtered = promotions.filter((promo) => {
    if (term) {
      const matchName = promo.name.toLowerCase().includes(term);
      const matchCode = promo.code ? promo.code.toLowerCase().includes(term) : false;
      const matchDesc = promo.description ? promo.description.toLowerCase().includes(term) : false;
      if (!matchName && !matchCode && !matchDesc) return false;
    }

    const opStatus = getPromotionOperationalStatus(promo);
    if (status === 'active' && opStatus !== 'ACTIVE') return false;
    if (status === 'inactive' && opStatus !== 'INACTIVE') return false;
    if (status === 'scheduled' && opStatus !== 'SCHEDULED') return false;
    if (status === 'ended' && opStatus !== 'ENDED') return false;

    if (type !== 'all' && promo.promo_type !== type) return false;

    if (attention === 'active' && opStatus !== 'ACTIVE') return false;
    if (attention === 'budget') {
      const budget = Number(promo.promo_budget) || 0;
      const spent = Number(promo.budget_spent) || 0;
      if (budget <= 0 && spent <= 0) return false;
    }
    if (attention === 'attention' && !isPromotionAttention(promo)) return false;

    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === 'name-desc') return b.name.localeCompare(a.name, 'id-ID');
    if (sort === 'created-desc') {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    if (sort === 'budget-desc') {
      const budgetDiff = (Number(b.promo_budget) || 0) - (Number(a.promo_budget) || 0);
      if (budgetDiff !== 0) return budgetDiff;
      return (Number(b.budget_spent) || 0) - (Number(a.budget_spent) || 0);
    }
    return a.name.localeCompare(b.name, 'id-ID');
  });
}
