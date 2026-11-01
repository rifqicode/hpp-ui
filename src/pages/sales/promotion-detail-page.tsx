import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PromotionCurrencyText } from '@/features/promotions/components/promotion-currency';
import { PromotionPageHeader } from '@/features/promotions/components/promotion-page-header';
import { PromotionStatusBadge } from '@/features/promotions/components/promotion-list-items';
import { usePromotionDetail } from '@/features/promotions/hooks/use-promotion-detail';
import { promotionError, promotionTypes } from '@/features/promotions/lib/promotion-form';
import { getPromotionOperationalStatus } from '@/features/promotions/lib/promotion-list';
import type { Promotion } from '@/features/promotions/types';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-5 gap-y-1 border-b py-3 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium sm:text-right">{children}</dd>
    </div>
  );
}

function dateTime(value: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return (
    new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(value)) + ' WIB'
  );
}

function RuleSummary({ promotion }: { promotion: Promotion }) {
  switch (promotion.promo_type) {
    case 'DIRECT_DISCOUNT':
      return (
        <>
          Potongan{' '}
          {promotion.discount_type === 'PERCENTAGE' ? (
            <>{Number(promotion.discount_value)}%</>
          ) : (
            <PromotionCurrencyText value={promotion.discount_value} />
          )}{' '}
          untuk {promotion.scope === 'BILL' ? 'total tagihan' : 'menu tertentu'}.
        </>
      );
    case 'BUY_X_GET_Y':
      return <>Beli menu persyaratan, dapatkan menu bonus gratis.</>;
    case 'BUNDLE':
      return (
        <>
          Menu dalam satu paket seharga <PromotionCurrencyText value={promotion.bundle_price} />.
        </>
      );
    case 'SPECIAL_PRICE':
      return (
        <>
          Belanja minimal <PromotionCurrencyText value={promotion.min_purchase_amount} />, lalu
          tebus menu dengan harga khusus.
        </>
      );
  }
}

function PromotionRules({ promotion }: { promotion: Promotion }) {
  const triggers = promotion.items.filter(item => item.item_role === 'TRIGGER');
  const rewards = promotion.items.filter(item => item.item_role === 'REWARD');
  const isDiscount = promotion.promo_type === 'DIRECT_DISCOUNT';
  const names = new Map(
    promotion.planning_snapshot?.lines.map(line => [line.variant_id, line.name]),
  );
  const groups = [
    {
      title: isDiscount
        ? 'Menu yang mendapat diskon'
        : promotion.promo_type === 'BUNDLE'
          ? 'Isi paket'
          : 'Menu persyaratan',
      items: promotion.scope === 'BILL' && isDiscount ? [] : triggers,
      reward: false,
    },
    {
      title: promotion.promo_type === 'SPECIAL_PRICE' ? 'Menu tebus murah' : 'Menu bonus',
      items: rewards,
      reward: true,
    },
  ];

  return (
    <section aria-labelledby="promotion-rules-title" className="min-w-0 space-y-5">
      <h2 id="promotion-rules-title" className="text-base font-semibold">
        Cara kerja promo
      </h2>
      <p className="max-w-2xl text-xl font-semibold leading-relaxed sm:text-2xl">
        <RuleSummary promotion={promotion} />
      </p>
      {isDiscount && promotion.scope === 'BILL' && (
        <p className="text-sm text-muted-foreground">Berlaku untuk semua menu dalam tagihan.</p>
      )}
      {groups
        .filter(group => group.items.length > 0)
        .map(group => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-sm font-medium">{group.title}</h3>
            <ul className="divide-y rounded-lg border">
              {group.items.map((item, index) => {
                const name =
                  item.selector_name || (item.variant_id ? names.get(item.variant_id) : undefined);
                return (
                  <li
                    key={index}
                    className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">
                        {name || 'Nama menu tidak tersedia'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.category_id
                          ? 'Semua varian dalam kategori'
                          : item.product_id
                            ? 'Semua varian produk'
                            : 'Varian tertentu'}
                      </p>
                    </div>
                    <p className="shrink-0 text-right tabular-nums">
                      {!isDiscount && <>{Number(item.required_quantity)} × </>}
                      {group.reward ? (
                        Number(item.reward_price) === 0 ? (
                          'Gratis'
                        ) : (
                          <PromotionCurrencyText value={item.reward_price} />
                        )
                      ) : !isDiscount ? (
                        'menu'
                      ) : (
                        'Termasuk promo'
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
            {!isDiscount &&
              !group.reward &&
              triggers.length > 1 &&
              promotion.promo_type !== 'BUNDLE' && (
                <p className="text-xs text-muted-foreground">
                  Semua persyaratan menu harus terpenuhi.
                </p>
              )}
          </div>
        ))}
      <dl className="text-sm">
        {promotion.promo_type !== 'SPECIAL_PRICE' && (
          <Field label="Minimum belanja">
            {Number(promotion.min_purchase_amount) > 0 ? (
              <PromotionCurrencyText value={promotion.min_purchase_amount} />
            ) : (
              'Tanpa minimum'
            )}
          </Field>
        )}
        {isDiscount && Number(promotion.max_discount_amount) > 0 && (
          <Field label="Maksimum potongan">
            <PromotionCurrencyText value={promotion.max_discount_amount} /> per transaksi
          </Field>
        )}
        {!isDiscount && (
          <>
            {promotion.promo_type !== 'SPECIAL_PRICE' && (
              <Field label="Berlaku kelipatan">
                {promotion.is_multiplier_allowed ? 'Ya' : 'Tidak'}
              </Field>
            )}
            <Field label="Batas per transaksi">
              {promotion.max_reward_per_transaction}{' '}
              {promotion.promo_type === 'BUNDLE' ? 'paket' : 'item bonus'}
            </Field>
          </>
        )}
        <Field label="Syarat pelanggan">
          {promotion.is_customer_required
            ? 'Nomor telepon pelanggan wajib diisi'
            : 'Semua pelanggan'}
        </Field>
        <Field label="Gabungan promo">
          Tidak dapat digabung dengan promo atau diskon manual lain
        </Field>
      </dl>
    </section>
  );
}

function PromotionBudget({ promotion }: { promotion: Promotion }) {
  const budget = Number(promotion.promo_budget);
  const spent = Number(promotion.budget_spent);
  const percentage = budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0;

  return (
    <section aria-labelledby="promotion-budget-title" className="rounded-xl border bg-card p-5">
      <h2 id="promotion-budget-title" className="font-semibold">
        Pemakaian promo
      </h2>
      <p className="mt-4 text-sm text-muted-foreground">Anggaran terpakai</p>
      <p className="mt-1 break-words text-2xl font-semibold tabular-nums">
        <PromotionCurrencyText value={promotion.budget_spent} />
      </p>
      {budget > 0 ? (
        <div className="mt-3 space-y-2">
          <Progress value={percentage} aria-label="Pemakaian anggaran promo" />
          <p className="text-xs text-muted-foreground">
            {percentage.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari{' '}
            <PromotionCurrencyText value={promotion.promo_budget} />
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Tanpa batas anggaran.</p>
      )}
      <dl className="mt-3 text-sm">
        {budget > 0 && (
          <Field label="Sisa anggaran">
            <PromotionCurrencyText value={Math.max(0, budget - spent)} />
          </Field>
        )}
        <Field label="Transaksi memakai promo">
          {promotion.usage_count.toLocaleString('id-ID')}
        </Field>
        <Field label="Batas pemakaian">
          {promotion.usage_limit > 0
            ? `${promotion.usage_limit.toLocaleString('id-ID')} transaksi`
            : 'Tanpa batas'}
        </Field>
      </dl>
      {budget > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Batas pemakaian dihitung dari simulasi saat promo disimpan. Setiap transaksi tetap
          diperiksa terhadap sisa anggaran.
        </p>
      )}
    </section>
  );
}

function SavedSimulation({ promotion }: { promotion: Promotion }) {
  const simulation = promotion.planning_snapshot;
  return (
    <section aria-labelledby="promotion-simulation-title" className="space-y-4 border-t pt-6">
      <div>
        <h2 id="promotion-simulation-title" className="font-semibold">
          Simulasi tersimpan
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Estimasi per contoh transaksi saat promo disimpan, belum termasuk biaya operasional. Ini
          bukan hasil penjualan aktual.
        </p>
      </div>
      {!simulation ? (
        <p className="text-sm text-muted-foreground">Belum ada simulasi tersimpan.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estimasi laba kotor</p>
              <p
                className={`mt-1 text-2xl font-semibold tabular-nums ${Number(simulation.unit_economics.gross_profit) < 0 ? 'text-destructive' : ''}`}
              >
                <PromotionCurrencyText value={simulation.unit_economics.gross_profit} />
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Margin{' '}
              {simulation.unit_economics.margin_pct === null
                ? 'tidak tersedia'
                : `${simulation.unit_economics.margin_pct}%`}
            </p>
          </div>
          {simulation.is_loss_leader && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Contoh transaksi ini menghasilkan rugi kotor.{' '}
              {promotion.loss_leader_confirmed
                ? 'Risiko sudah dikonfirmasi saat promo disimpan.'
                : 'Periksa kembali aturan sebelum mengaktifkan promo.'}
            </p>
          )}
          <details className="group rounded-lg border px-4">
            <summary className="cursor-pointer py-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
              Lihat contoh transaksi dan rincian HPP
            </summary>
            <div className="space-y-4 pb-4">
              <ul className="divide-y border-t">
                {simulation.lines.map((line, index) => (
                  <li
                    key={`${line.variant_id}-${index}`}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">
                        {line.name} × {Number(line.quantity)}
                      </p>
                      {line.is_reward_item && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {Number(line.charged_price) === 0 ? 'Bonus gratis' : 'Harga tebus murah'}
                        </p>
                      )}
                    </div>
                    <PromotionCurrencyText value={line.subtotal} className="tabular-nums" />
                  </li>
                ))}
              </ul>
              <dl className="text-sm">
                <Field label="Harga normal">
                  <PromotionCurrencyText value={simulation.unit_economics.gross_sales} />
                </Field>
                <Field label="Potongan dan bonus">
                  <PromotionCurrencyText value={simulation.unit_economics.promo_discount} />
                </Field>
                <Field label="Penjualan setelah promo">
                  <PromotionCurrencyText value={simulation.unit_economics.net_sales} />
                </Field>
                <Field label="HPP">
                  <PromotionCurrencyText value={simulation.unit_economics.total_cogs} />
                </Field>
                <Field label="Dasar HPP">
                  {simulation.cost_basis_used === 'LATEST_HPP'
                    ? 'HPP produksi terakhir'
                    : 'Harga bahan baku saat simulasi'}
                </Field>
              </dl>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export default function PromotionDetailPage({
  storeId,
  promotionId,
  onEdit,
  busy,
  actionError,
}: {
  storeId: string;
  promotionId: string;
  onEdit: (promotion: Promotion) => void;
  busy: boolean;
  actionError: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { detail, canRead, canWrite } = usePromotionDetail(storeId, promotionId);
  const promotion = canRead ? detail.data : undefined;

  return (
    <div className="w-full min-w-0 space-y-6 pb-6">
      <PromotionPageHeader
        title={promotion?.name || 'Detail Promosi'}
        description={promotion?.description || 'Aturan, periode, dan pemakaian promosi.'}
        onBack={() => navigate(`/sales/promotions${location.search}`)}
        disabled={busy}
        actions={
          canRead &&
          canWrite &&
          promotion && (
            <Button type="button" disabled={busy} onClick={() => onEdit(promotion)}>
              {busy ? 'Membuka editor…' : 'Ubah promosi'}
            </Button>
          )
        }
      />
      {!canRead ? (
        <p role="alert" className="text-sm">
          Anda tidak memiliki izin untuk melihat detail promosi.
        </p>
      ) : detail.isPending ? (
        <p role="status" aria-label="Memuat detail promosi" className="rounded-xl border p-6 text-sm text-muted-foreground">
          Memuat aturan dan pemakaian promo…
        </p>
      ) : detail.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-5">
          <p className="font-medium">Detail promosi belum dapat dimuat.</p>
          <p className="text-sm text-muted-foreground">{promotionError(detail.error)}</p>
          <Button type="button" variant="outline" onClick={() => void detail.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        promotion && (
          <>
            {actionError && (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 border-b pb-5 text-sm">
              <PromotionStatusBadge status={getPromotionOperationalStatus(promotion)} />
              <span>{promotionTypes.find(type => type.value === promotion.promo_type)?.label}</span>
              {promotion.code && (
                <span className="break-all text-muted-foreground">
                  Kode: <span className="font-medium text-foreground">{promotion.code}</span>
                </span>
              )}
            </div>
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,21rem)]">
              <div className="min-w-0 space-y-8">
                <PromotionRules promotion={promotion} />
                <SavedSimulation promotion={promotion} />
              </div>
              <aside className="min-w-0 space-y-6">
                <PromotionBudget promotion={promotion} />
                <section aria-labelledby="promotion-schedule-title" className="px-1">
                  <h2 id="promotion-schedule-title" className="font-semibold">
                    Periode & kanal
                  </h2>
                  <dl className="mt-2 text-sm">
                    <Field label="Mulai">
                      {dateTime(promotion.start_at) || 'Tanpa tanggal mulai'}
                    </Field>
                    <Field label="Berakhir">
                      {dateTime(promotion.end_at) || 'Tanpa tanggal akhir'}
                    </Field>
                    <Field label="Kanal penjualan">
                      {promotion.applicable_channels
                        .map(channel => (channel === 'POS' ? 'Kasir POS' : 'Online / Storefront'))
                        .join(', ')}
                    </Field>
                    <Field label="Terakhir diperbarui">
                      {dateTime(promotion.updated_at) || 'Tidak tersedia'}
                    </Field>
                  </dl>
                </section>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
