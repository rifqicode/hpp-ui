import React from 'react';
import { useSubscriptionGuards } from '../hooks/useSubscriptionGuards';
import type { SubscriptionQuotas } from '../types/subscription';

interface QuotaBadgeProps {
  resource: keyof SubscriptionQuotas;
  label: string;
  onUpgradeClick?: () => void;
  className?: string;
}

export const QuotaBadge: React.FC<QuotaBadgeProps> = ({ resource, label, onUpgradeClick, className = '' }) => {
  const { getQuotaStats } = useSubscriptionGuards();
  const { current, limit, percentage } = getQuotaStats(resource);

  // If no quota or uninitialized, don't show
  if (limit === 0) return null;

  // Unlimited tier
  if (limit === -1) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-slate-50 text-slate-700 border-slate-200 dark:bg-muted/40 dark:border-border dark:text-foreground ${className}`}>
        <span className="font-medium text-muted-foreground">{label}:</span>
        <span className="font-mono font-bold text-foreground">{current}</span>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50">
          Tak Terbatas
        </span>
      </div>
    );
  }

  const isFull = current >= limit;
  const isNearLimit = percentage >= 80;

  const barColor = isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500';
  const badgeColor = isFull
    ? 'bg-rose-50/80 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300'
    : isNearLimit
    ? 'bg-amber-50/80 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300'
    : 'bg-muted/50 text-muted-foreground border-border';

  return (
    <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs shadow-xs ${badgeColor} ${className}`}>
      <div>
        <span className="font-medium">{label}:</span>{' '}
        <span className="font-mono font-bold text-foreground">{current}</span> / <span className="font-mono">{limit}</span>
      </div>
      <div className="w-14 sm:w-16 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
      {isFull && onUpgradeClick && (
        <button
          type="button"
          onClick={onUpgradeClick}
          className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer ml-0.5"
        >
          Upgrade
        </button>
      )}
    </div>
  );
};
