import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSubscriptionGuards } from '../hooks/useSubscriptionGuards';
import type { SubscriptionQuotas } from '../types/subscription';

export interface QuotaBadgeProps {
  resource?: keyof SubscriptionQuotas;
  label: string;
  current?: number;
  limit?: number;
  onUpgradeClick?: () => void;
  className?: string;
}

interface BadgeViewProps {
  label: string;
  current: number;
  limit: number;
  percentage: number;
  onUpgradeClick?: () => void;
  className?: string;
}

const BadgeView: React.FC<BadgeViewProps> = ({
  label,
  current,
  limit,
  percentage,
  onUpgradeClick,
  className,
}) => {
  if (limit === 0) return null;

  const isUnlimited = limit === -1;
  const isFull = !isUnlimited && current >= limit;
  const isNearLimit = !isUnlimited && !isFull && percentage >= 80;
  const statusColor = isFull
    ? 'text-rose-700 dark:text-rose-300'
    : isNearLimit
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-muted-foreground';

  return (
    <div
      data-slot="quota-badge"
      className={cn(
        'mt-3 flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span className="font-medium">{label}:</span>{' '}
        <span className="whitespace-nowrap font-semibold tabular-nums text-foreground">
          {current.toLocaleString('id-ID')}
          {!isUnlimited && ` / ${limit.toLocaleString('id-ID')}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          aria-label={label}
          aria-valuetext={`${current.toLocaleString('id-ID')} dari ${limit.toLocaleString('id-ID')}`}
          className="h-1.5 w-16 shrink-0 bg-border"
          indicatorClassName={cn(
            'motion-reduce:transition-none',
            isFull
              ? 'bg-rose-600 dark:bg-rose-400'
              : isNearLimit
                ? 'bg-amber-700 dark:bg-amber-400'
                : 'bg-primary',
          )}
        />
      )}
      {(isUnlimited || isFull || isNearLimit) && (
        <span className={cn('font-medium', statusColor)}>
          {isUnlimited ? 'Tak Terbatas' : isFull ? 'Batas tercapai' : 'Hampir penuh'}
        </span>
      )}
      {isFull && onUpgradeClick && (
        <button
          type="button"
          onClick={onUpgradeClick}
          className="-my-3 min-h-11 cursor-pointer rounded px-1 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Upgrade
        </button>
      )}
    </div>
  );
};

const ResourceQuotaBadge: React.FC<QuotaBadgeProps & { resource: keyof SubscriptionQuotas }> = ({
  resource,
  label,
  onUpgradeClick,
  className,
}) => {
  const { getQuotaStats } = useSubscriptionGuards();
  const { current, limit, percentage } = getQuotaStats(resource);

  return (
    <BadgeView
      label={label}
      current={current}
      limit={limit}
      percentage={percentage}
      onUpgradeClick={onUpgradeClick}
      className={className}
    />
  );
};

export const QuotaBadge: React.FC<QuotaBadgeProps> = props => {
  if (props.current !== undefined && props.limit !== undefined) {
    const percentage = props.limit > 0 ? (props.current / props.limit) * 100 : 0;
    return (
      <BadgeView
        label={props.label}
        current={props.current}
        limit={props.limit}
        percentage={percentage}
        onUpgradeClick={props.onUpgradeClick}
        className={props.className}
      />
    );
  }

  if (props.resource) {
    return <ResourceQuotaBadge {...props} resource={props.resource} />;
  }

  return null;
};
