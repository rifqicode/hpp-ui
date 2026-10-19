import type { ProductionStatus } from '../types';
import { PRODUCTION_STATUSES } from '../types/production-status';
import { cn } from '@/lib/utils';


export function ProductionStatusBadge({ status }: { status: ProductionStatus }) {
  const config = PRODUCTION_STATUSES[status];
  return <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', config.color)}>
    <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', config.dot)} />{config.label}
  </span>;
}
