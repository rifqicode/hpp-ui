import { AlertTriangle, Check, CheckCircle2, Coins, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { cn } from '@/lib/utils';
import type { PromotionAttentionFilter } from '../lib/promotion-list';

const numberFormat = new Intl.NumberFormat('id-ID');

interface PromotionListStatsProps {
  stats: {
    total: number;
    active: number;
    budgetSpent: number;
    attention: number;
  };
  activeFilter: PromotionAttentionFilter;
  hasFilters: boolean;
  onSelectFilter: (filter: PromotionAttentionFilter) => void;
  isLoading: boolean;
  isError: boolean;
}

export function PromotionListStats({
  stats,
  activeFilter,
  hasFilters,
  onSelectFilter,
  isLoading,
  isError,
}: PromotionListStatsProps) {
  const ready = !isLoading && !isError;

  const items = [
    {
      label: 'Total Promosi',
      value: stats.total,
      isCurrency: false,
      filter: 'all' as PromotionAttentionFilter,
      description: 'Semua promosi terdaftar',
      icon: Tag,
      iconClass: 'bg-accent text-accent-foreground',
    },
    {
      label: 'Promosi Aktif',
      value: stats.active,
      isCurrency: false,
      filter: 'active' as PromotionAttentionFilter,
      description: 'Promosi yang sedang berjalan',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      label: 'Anggaran Terpakai',
      value: stats.budgetSpent,
      isCurrency: true,
      filter: 'budget' as PromotionAttentionFilter,
      description: 'Total realisasi anggaran diskon',
      icon: Coins,
      iconClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      label: 'Perlu Perhatian',
      value: stats.attention,
      isCurrency: false,
      filter: 'attention' as PromotionAttentionFilter,
      description: 'Defisit margin atau anggaran mendekati habis',
      icon: AlertTriangle,
      iconClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
  ];

  return (
    <section
      aria-label="Ringkasan promosi"
      aria-busy={isLoading}
      className="grid min-w-0 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4"
    >
      {items.map(({ label, value, isCurrency, filter, description, icon: Icon, iconClass }) => {
        const selected = ready && (filter === 'all' ? !hasFilters && activeFilter === 'all' : activeFilter === filter);

        return (
          <Button
            key={filter}
            type="button"
            variant="outline"
            disabled={!ready}
            aria-pressed={selected}
            onClick={() => {
              if (filter === 'all') {
                onSelectFilter('all');
              } else {
                onSelectFilter(activeFilter === filter ? 'all' : filter);
              }
            }}
            className={cn(
              'h-auto min-w-0 flex-col items-stretch justify-start gap-0 whitespace-normal rounded-xl border-0 bg-card px-3 py-4 text-left shadow-none ring-1 ring-foreground/10 transition-colors hover:bg-card hover:ring-primary disabled:opacity-100 sm:px-5',
              selected && 'ring-primary'
            )}
          >
            <span className="flex items-center justify-between gap-1.5">
              <span className="min-w-0 text-xs font-medium text-muted-foreground sm:text-sm">
                {label}
              </span>
              <span className={cn('flex shrink-0 items-center justify-center rounded-lg p-1.5 sm:p-2', iconClass)}>
                <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
            </span>
            <span className="mt-3 flex items-center justify-between gap-2">
              {isLoading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-7 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none lg:h-8"
                  />
                  <span className="sr-only">Memuat {label}</span>
                </>
              ) : (
                <span className="min-w-0 text-xl font-bold tracking-tight tabular-nums text-foreground [overflow-wrap:anywhere] lg:text-2xl">
                  {ready ? (
                    isCurrency ? (
                      <CurrencyText value={value} />
                    ) : (
                      numberFormat.format(value)
                    )
                  ) : (
                    '-'
                  )}
                </span>
              )}
              {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </span>
            <span className="mt-2 text-xs font-normal leading-relaxed text-muted-foreground xl:min-h-[3.25em]">
              {isError ? 'Data belum bisa dimuat' : description}
            </span>
          </Button>
        );
      })}
    </section>
  );
}
