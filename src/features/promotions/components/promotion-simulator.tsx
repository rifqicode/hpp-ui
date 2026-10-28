import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CurrencyText } from '@/components/ui/currency-text';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { healthLabels } from '../lib/promotion-form';
import type { HealthStatus, PromotionSimulation } from '../types';

export function PromotionHealth({ status }: { status: HealthStatus }) {
  return (
    <Badge
      variant={
        status === 'PROFITABLE'
          ? 'success'
          : status === 'LOW_MARGIN'
          ? 'warning'
          : 'destructive'
      }
      className="text-xs px-2.5 py-0.5 font-medium"
    >
      {healthLabels[status]}
    </Badge>
  );
}

export function PromotionSimulator({
  simulation,
  loading,
  error,
  readiness,
  readOnly,
  retry,
}: {
  simulation?: PromotionSimulation | null;
  loading: boolean;
  error: string;
  readiness: string;
  readOnly: boolean;
  retry: () => void;
}) {
  const isDeficit = simulation?.health_status === 'MARGIN_DEFICIT' || simulation?.is_loss_leader;
  const isLowMargin = simulation?.health_status === 'LOW_MARGIN';

  return (
    <Card className="min-w-0 rounded-2xl border border-border/80 bg-card shadow-sm xl:sticky xl:top-4">
      <CardHeader className="border-b border-dashed border-border/80 p-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            <h2>{readOnly ? 'Simulasi tersimpan' : 'Kalkulator Untung-Rugi Promo'}</h2>
          </CardTitle>
          {simulation && <PromotionHealth status={simulation.health_status} />}
        </div>
        <CardDescription className="text-xs leading-5 sm:text-sm">
          {readOnly
            ? 'Estimasi keuntungan dan modal bahan saat promosi ini disimpan.'
            : 'Perhitungan otomatis agar promo tetap menguntungkan dan tidak boncos.'}
        </CardDescription>
      </CardHeader>
      <CardContent
        className="space-y-4 p-4 sm:p-5"
        aria-live="polite"
        aria-busy={loading}
      >
        {loading ? (
          <div className="space-y-3 py-6 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Menghitung keuntungan toko…</p>
          </div>
        ) : error ? (
          <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              type="button"
              className="h-9 rounded-lg"
              variant="outline"
              onClick={retry}
            >
              Ulangi simulasi
            </Button>
          </div>
        ) : !simulation ? (
          <p className="py-6 text-center text-sm leading-relaxed text-muted-foreground">
            {readOnly
              ? 'Belum ada simulasi tersimpan.'
              : readiness || 'Lengkapi aturan promo dan contoh pesanan untuk melihat kalkulasi untung-rugi.'}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Dasar Perhitungan Modal:</span>
              <span className="font-semibold text-foreground">
                {simulation.cost_basis_used === 'LATEST_HPP'
                  ? 'Modal Masak/Produksi Terakhir'
                  : 'Harga Bahan Baku Sekarang'}
              </span>
            </div>

            {/* Big prominent Keuntungan Bersih Toko */}
            <div
              className={cn(
                'rounded-xl border p-4 text-center space-y-1 transition-colors',
                isDeficit
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : isLowMargin
                  ? 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400'
                  : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Keuntungan Bersih Toko
              </p>
              <CurrencyText
                value={simulation.unit_economics.gross_profit}
                className={cn(
                  'block text-3xl font-extrabold tabular-nums tracking-tight',
                  isDeficit ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                )}
                allowDecimal
                decimalDigits={2}
              />
              <p className="text-xs text-muted-foreground">
                Margin{' '}
                <span className="font-semibold text-foreground">
                  {simulation.unit_economics.margin_pct === null
                    ? '-'
                    : `${simulation.unit_economics.margin_pct}%`}
                </span>{' '}
                per 1x transaksi
              </p>
            </div>

            {/* Breakdown table with dashed dividers between Harga Normal -> Diskon -> Uang Masuk -> Modal Bahan */}
            <div className="rounded-xl border border-dashed border-border/90 bg-muted/20 p-3.5 space-y-2.5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hitungan per 1x Transaksi
              </p>
              <div className="flex justify-between gap-x-3 gap-y-1">
                <span className="text-muted-foreground">Harga Normal Menu:</span>
                <span className="font-medium tabular-nums">
                  <CurrencyText value={simulation.unit_economics.gross_sales} allowDecimal />
                </span>
              </div>
              <div className="flex justify-between gap-x-3 gap-y-1 border-t border-dashed border-border/80 pt-2 text-destructive">
                <span>Potongan Diskon & Bonus:</span>
                <span className="font-medium tabular-nums">
                  -<CurrencyText value={simulation.unit_economics.promo_discount} allowDecimal />
                </span>
              </div>
              <div className="flex justify-between gap-x-3 gap-y-1 border-t border-dashed border-border/80 pt-2 font-semibold">
                <span>Uang Masuk ke Kasir:</span>
                <span className="tabular-nums">
                  <CurrencyText value={simulation.unit_economics.net_sales} allowDecimal />
                </span>
              </div>
              <div className="flex justify-between gap-x-3 gap-y-1 border-t border-dashed border-border/80 pt-2 text-muted-foreground">
                <span>Modal Bahan Baku (HPP):</span>
                <span className="font-medium tabular-nums text-foreground">
                  <CurrencyText value={simulation.unit_economics.total_cogs} allowDecimal />
                </span>
              </div>
            </div>

            <Separator className="border-dashed" />

            {/* Batas Anggaran Toko & Batas Jumlah Transaksi */}
            <dl className="space-y-2 rounded-xl border bg-muted/20 p-3.5 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">Batas Anggaran Promo Toko:</dt>
                <dd className="font-medium tabular-nums">
                  {/^0(?:\.0*)?$/.test(simulation.budget_analysis.total_budget) ? (
                    'Tanpa batas'
                  ) : (
                    <CurrencyText value={simulation.budget_analysis.total_budget} />
                  )}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">Batas Jumlah Transaksi:</dt>
                <dd className="font-medium tabular-nums">
                  {/^0(?:\.0*)?$/.test(simulation.budget_analysis.total_budget)
                    ? 'Tanpa batas anggaran'
                    : `${simulation.budget_analysis.recommended_usage_limit.toLocaleString('id-ID')} transaksi`}
                </dd>
              </div>
              {!/^0(?:\.0*)?$/.test(simulation.budget_analysis.total_budget) && (
                <div className="flex flex-wrap justify-between gap-2 border-t pt-2">
                  <dt className="text-muted-foreground">Total Keuntungan Bersih Toko:</dt>
                  <dd className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    <CurrencyText
                      value={simulation.budget_analysis.projected_gross_profit}
                      allowDecimal
                    />
                  </dd>
                </div>
              )}
            </dl>

            {/* Saran Pintar Container with Sparkles icon */}
            {simulation.prescriptive_advice
              .filter((advice) => advice.type !== 'ESTIMATE')
              .map((advice, index) => (
                <div
                  key={`${advice.type}-${index}`}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
                >
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      Saran Pintar:{' '}
                      {advice.type === 'CRITICAL_LOSS'
                        ? 'Strategi Nombok (Perlu Evaluasi)'
                        : advice.type === 'INSUFFICIENT_BUDGET'
                        ? 'Anggaran Kurang Memadai'
                        : advice.type === 'LOW_MARGIN'
                        ? 'Margin Terlalu Tipis'
                        : 'Saran Optimasi'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {advice.message}
                  </p>
                </div>
              ))}

            {/* Rincian Menu Pesanan Contoh */}
            <details className="rounded-xl border bg-muted/10 p-3">
              <summary className="min-h-9 cursor-pointer py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                Rincian Menu Pesanan Contoh ({simulation.lines.length} menu)
              </summary>
              <ul className="space-y-3 pt-2">
                {simulation.lines.map((line, index) => (
                  <li
                    key={`${line.variant_id}-${index}`}
                    className="space-y-1 border-t pt-3 text-xs"
                  >
                    <p className="break-words font-medium">
                      {line.name} × {line.quantity}{' '}
                      {line.is_reward_item && (
                        <span className="font-semibold text-primary">
                          {/^0(?:\.0*)?$/.test(line.charged_price)
                            ? '[GRATIS]'
                            : '[TEBUS MURAH]'}
                        </span>
                      )}
                    </p>
                    <p className="tabular-nums text-muted-foreground">
                      Uang Masuk{' '}
                      <CurrencyText
                        value={line.subtotal}
                        allowDecimal
                        decimalDigits={2}
                      />{' '}
                      · Modal{' '}
                      <CurrencyText
                        value={line.total_cost}
                        allowDecimal
                        decimalDigits={2}
                      />
                    </p>
                    <p className="tabular-nums font-medium">
                      Untung Bersih{' '}
                      <CurrencyText
                        value={line.gross_profit}
                        allowDecimal
                        decimalDigits={2}
                        className={Number(line.gross_profit) < 0 ? 'text-destructive font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}
                      />
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}