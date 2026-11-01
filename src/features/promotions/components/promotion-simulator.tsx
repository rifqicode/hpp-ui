import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { healthLabels } from '../lib/promotion-form';
import type { HealthStatus, PromotionSimulation } from '../types';
import { PromotionCurrencyText } from './promotion-currency';

export function PromotionHealth({ status }: { status: HealthStatus }) {
  return (
    <Badge
      variant={
        status === 'PROFITABLE' ? 'success' : status === 'LOW_MARGIN' ? 'warning' : 'destructive'
      }
    >
      {status === 'MARGIN_DEFICIT' ? 'Rugi kotor' : healthLabels[status]}
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
  const loss = Boolean(
    simulation && (simulation.is_loss_leader || Number(simulation.unit_economics.gross_profit) < 0),
  );
  return (
    <Card className="min-w-0 gap-0 rounded-xl border py-0 shadow-none ring-0">
      <CardHeader className="border-b p-4 sm:p-5">
        <h2 className="font-semibold">
          {readOnly ? 'Simulasi tersimpan' : 'Estimasi per transaksi'}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Berdasarkan contoh pesanan dan dasar HPP yang dipilih, sebelum biaya operasional. Bukan
          hasil penjualan aktual.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5 p-4 sm:p-5" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p role="status" className="py-4 text-sm text-muted-foreground">
            Menghitung estimasi promo…
          </p>
        ) : error ? (
          <div role="alert" className="space-y-3 text-sm">
            <p className="text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={retry}
            >
              Ulangi simulasi
            </Button>
          </div>
        ) : !simulation ? (
          <p className="py-4 text-sm leading-6 text-muted-foreground">
            {readOnly
              ? 'Belum ada simulasi tersimpan.'
              : readiness || 'Lengkapi dasar HPP dan contoh pesanan untuk melihat estimasi.'}
          </p>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Estimasi laba kotor</p>
              <p
                className={cn(
                  'mt-1 break-words text-3xl font-semibold tabular-nums',
                  loss && 'text-destructive',
                )}
              >
                <PromotionCurrencyText value={simulation.unit_economics.gross_profit} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Margin{' '}
                {simulation.unit_economics.margin_pct === null
                  ? 'tidak tersedia'
                  : `${Number(simulation.unit_economics.margin_pct).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`}
              </p>
              <div className="mt-3">
                <PromotionHealth status={simulation.health_status} />
              </div>
            </div>
            {loss && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm leading-6 text-destructive">
                Estimasi rugi{' '}
                <PromotionCurrencyText
                  value={simulation.unit_economics.gross_profit.replace(/^-/, '')}
                />{' '}
                per contoh transaksi. Aktivasi memerlukan konfirmasi risiko.
              </p>
            )}
            <dl className="space-y-3 border-t pt-4 text-sm">
              {[
                { label: 'Harga normal', value: simulation.unit_economics.gross_sales },
                { label: 'Potongan dan bonus', value: simulation.unit_economics.promo_discount },
                { label: 'Setelah promo', value: simulation.unit_economics.net_sales },
                { label: 'HPP', value: simulation.unit_economics.total_cogs },
              ].map(row => (
                <div key={row.label} className="flex flex-wrap justify-between gap-2">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium tabular-nums">
                    <PromotionCurrencyText value={row.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t pt-4 text-sm leading-6">
              {Number(simulation.budget_analysis.total_budget) > 0 ? (
                <p>
                  Anggaran <PromotionCurrencyText value={simulation.budget_analysis.total_budget} />{' '}
                  cukup untuk estimasi{' '}
                  <strong>
                    {simulation.budget_analysis.recommended_usage_limit.toLocaleString('id-ID')}{' '}
                    transaksi
                  </strong>{' '}
                  dengan contoh pesanan ini.
                </p>
              ) : (
                <p>Tanpa batas anggaran promo.</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Pemakaian aktual bergantung pada isi transaksi dan sisa anggaran.
              </p>
            </div>
            {simulation.prescriptive_advice.some(
              advice => advice.type === 'INSUFFICIENT_BUDGET',
            ) && (
              <p className="text-sm text-destructive">
                Anggaran belum cukup untuk satu contoh transaksi. Naikkan anggaran atau ubah aturan
                promo.
              </p>
            )}
            <details className="border-t pt-2">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                Rincian contoh pesanan dan HPP
              </summary>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Dasar HPP:{' '}
                {simulation.cost_basis_used === 'LATEST_HPP'
                  ? 'produksi terakhir'
                  : 'harga bahan baku sekarang'}
                .
              </p>
              <ul className="mt-3 divide-y">
                {simulation.lines.map((line, index) => (
                  <li
                    key={`${line.variant_id}-${index}`}
                    className="space-y-1 py-3 text-xs leading-5"
                  >
                    <p className="break-words font-medium">
                      {line.name} × {line.quantity}
                      {line.is_reward_item &&
                        (Number(line.charged_price) === 0 ? ' · Bonus gratis' : ' · Tebus murah')}
                    </p>
                    <p className="text-muted-foreground">
                      Setelah promo <PromotionCurrencyText value={line.subtotal} /> · HPP{' '}
                      <PromotionCurrencyText value={line.total_cost} />
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
