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
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Promosi & Diskon
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Atur model promosi dan batas anggaran, lalu pantau keuntungan bersih toko.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-lg"
          onClick={onRefresh}
          disabled={isFetching || busy}
          aria-label="Refresh promosi"
        >
          <RefreshCw
            className={cn(
              'mr-1.5 h-3.5 w-3.5',
              (isFetching || busy) && 'animate-spin'
            )}
          />
          Refresh
        </Button>

        {canWrite && (
          <Button
            className="h-9 rounded-lg"
            disabled={busy}
            onClick={onCreate}
            aria-label="Buat promosi"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Promosi
          </Button>
        )}

        <QuotaBadge
          label="Promo Aktif"
          current={activeCount}
          limit={maxActive}
          className="ml-auto"
          onUpgradeClick={onUpgrade}
        />
      </div>
    </header>
  );
}
