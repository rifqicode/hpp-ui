import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuotaBadge } from '@/features/subscription';

interface PromotionListHeaderProps {
  onRefresh: () => void;
  onCreate: () => void;
  isFetching: boolean;
  busy: boolean;
  canWrite: boolean;
  activeCount: number;
  maxActive: number;
  onUpgrade?: () => void;
}

export function PromotionListHeader({
  onRefresh,
  onCreate,
  isFetching,
  busy,
  canWrite,
  activeCount,
  maxActive,
  onUpgrade,
}: PromotionListHeaderProps) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Promosi & Diskon</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Kelola aturan promo, periode berlaku, dan pemakaian anggaran.
        </p>
        <QuotaBadge
          label="Kuota promo aktif"
          current={activeCount}
          limit={maxActive}
          onUpgradeClick={onUpgrade}
        />
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <Button
          variant="outline"
          className="h-11 sm:h-10"
          onClick={onRefresh}
          disabled={isFetching || busy}
          aria-label="Refresh promosi"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn('size-4', isFetching && 'animate-spin motion-reduce:animate-none')}
          />
          Muat ulang
        </Button>

        {canWrite && (
          <Button
            className="h-11 flex-1 sm:h-10 sm:flex-none"
            disabled={busy}
            onClick={onCreate}
            aria-label="Buat promosi"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Buat promosi
          </Button>
        )}
      </div>
    </header>
  );
}
