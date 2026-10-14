import { useSubscriptionUsage } from './useSubscriptionUsage';
import type { SubscriptionFeatures, SubscriptionQuotas } from '../types/subscription';

export const useSubscriptionGuards = () => {
  const { data: usage, isLoading, error, refetch } = useSubscriptionUsage();

  const canAccessFeature = (feature: keyof SubscriptionFeatures): boolean => {
    if (!usage) return false;
    return Boolean(usage.features[feature]);
  };

  const isQuotaReached = (resource: keyof SubscriptionQuotas): boolean => {
    if (!usage) return false;
    const item = usage.quotas[resource];
    if (!item) return false;
    if (item.limit === -1) return false; // -1 represents unlimited
    return item.current >= item.limit;
  };

  const getRemainingQuota = (resource: keyof SubscriptionQuotas): number => {
    if (!usage) return 0;
    const item = usage.quotas[resource];
    if (!item) return 0;
    if (item.limit === -1) return Infinity;
    return Math.max(0, item.limit - item.current);
  };

  const getQuotaStats = (resource: keyof SubscriptionQuotas) => {
    if (!usage) return { current: 0, limit: 0, remaining: 0, percentage: 0 };
    const item = usage.quotas[resource];
    if (!item) return { current: 0, limit: 0, remaining: 0, percentage: 0 };

    if (item.limit === -1) {
      return { current: item.current, limit: -1, remaining: Infinity, percentage: 0 };
    }

    const percentage = item.limit > 0 ? Math.min(100, Math.round((item.current / item.limit) * 100)) : 0;
    return { ...item, percentage };
  };

  return {
    usage,
    isLoading,
    error,
    refetch,
    tier: usage?.effective_tier || 'FREE',
    status: usage?.status || 'ACTIVE',
    isInGracePeriod: Boolean(usage?.is_in_grace_period),
    gracePeriodUntil: usage?.grace_period_until,
    currentPeriodEnd: usage?.current_period_end,
    canAccessFeature,
    isQuotaReached,
    getRemainingQuota,
    getQuotaStats,
  };
};
