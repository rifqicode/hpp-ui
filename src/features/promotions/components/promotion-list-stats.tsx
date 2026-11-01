import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PromotionSummary } from '../types';

export function PromotionListStats({
  summary,
  isLoading,
  isError,
  onRetry,
}: {
  summary?: PromotionSummary;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <section aria-label="Ringkasan promosi" aria-busy={isLoading} className="space-y-3">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            label: 'Promo aktif',
            count: summary?.active_count,
            description: 'Sedang berlaku',
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
          },
          {
            label: 'Promo nonaktif',
            count: summary?.inactive_count,
            description: 'Tidak diaktifkan',
            icon: Circle,
            iconClass: 'bg-accent text-accent-foreground',
          },
        ].map(({ label, count, description, icon: Icon, iconClass }) => (
          <Card key={label} className="min-w-0 border-border/80 bg-card px-4 py-3 shadow-2xs">
            <CardContent className="flex items-center justify-between gap-2 p-0">
              <div className="min-w-0 space-y-1">
                <h2 className="text-xs font-medium text-muted-foreground">{label}</h2>
                {isLoading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="block h-7 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none lg:h-8"
                    />
                    <span className="sr-only">Memuat {label.toLowerCase()}</span>
                  </>
                ) : (
                  <p className="text-xl font-bold tracking-tight tabular-nums text-foreground [overflow-wrap:anywhere]">
                    {!isError && count !== undefined ? count.toLocaleString('id-ID') : '-'}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>
              <span className={cn('shrink-0 rounded-xl p-2.5', iconClass)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      {isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <span>Ringkasan promo belum dapat dimuat.</span>
          <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={onRetry}>
            Muat ulang ringkasan
          </Button>
        </div>
      )}
    </section>
  );
}
