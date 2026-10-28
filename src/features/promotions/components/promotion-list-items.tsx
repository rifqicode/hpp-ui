import { AlertTriangle, MoreHorizontal, Plus, Tag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CurrencyText } from '@/components/ui/currency-text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { promotionTypes } from '../lib/promotion-form';
import {
  getPromotionOperationalStatus,
  isPromotionAttention,
  type PromotionOperationalStatus,
} from '../lib/promotion-list';
import { PromotionHealth } from './promotion-simulator';
import type { Promotion } from '../types';

interface PromotionItemProps {
  promotion: Promotion;
  canWrite: boolean;
  canDelete: boolean;
  busy: boolean;
  onOpen: (promotion: Promotion) => void;
  onToggle: (promotion: Promotion) => void;
  onArchive: (promotion: Promotion) => void;
}

export function PromotionStatusBadge({ status }: { status: PromotionOperationalStatus }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Aktif</Badge>;
    case 'SCHEDULED':
      return <Badge variant="warning">Terjadwal</Badge>;
    case 'ENDED':
      return <Badge variant="outline">Berakhir</Badge>;
    case 'INACTIVE':
    default:
      return <Badge variant="secondary">Nonaktif</Badge>;
  }
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getPromoTypeDetails(promo: Promotion) {
  const typeObj = promotionTypes.find((t) => t.value === promo.promo_type);
  const typeLabel = typeObj?.label || promo.promo_type;

  let detail = '';
  if (promo.promo_type === 'DIRECT_DISCOUNT') {
    if (promo.discount_type === 'PERCENTAGE') {
      detail = `${promo.discount_value}% (${promo.scope === 'BILL' ? 'Total tagihan' : 'Menu tertentu'})`;
    } else {
      detail = `Rp ${Number(promo.discount_value || 0).toLocaleString('id-ID')} (${promo.scope === 'BILL' ? 'Total tagihan' : 'Menu tertentu'})`;
    }
  } else if (promo.promo_type === 'BUNDLE') {
    detail = promo.bundle_price
      ? `Paket Rp ${Number(promo.bundle_price).toLocaleString('id-ID')}`
      : 'Paket kombo hemat';
  } else if (promo.promo_type === 'BUY_X_GET_Y') {
    detail = 'Beli syarat gratis bonus';
  } else if (promo.promo_type === 'SPECIAL_PRICE') {
    detail = 'Harga khusus tebus murah';
  }

  return { typeLabel, detail };
}

export function PromotionActions({
  promotion,
  canWrite,
  canDelete,
  busy,
  onOpen,
  onToggle,
  onArchive,
}: PromotionItemProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        disabled={busy}
        onClick={() => onOpen(promotion)}
      >
        {canWrite ? 'Ubah' : 'Lihat'}
      </Button>
      {canWrite && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          disabled={busy}
          onClick={() => onToggle(promotion)}
        >
          {promotion.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => onArchive(promotion)}
        >
          Arsipkan
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Aksi untuk ${promotion.name}`}
            className="size-8 shrink-0"
            disabled={busy}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpen(promotion)}>
            {canWrite ? 'Ubah' : 'Lihat detail'}
          </DropdownMenuItem>
          {canWrite && (
            <DropdownMenuItem onClick={() => onToggle(promotion)}>
              {promotion.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onArchive(promotion)}
                className="text-red-700 focus:text-red-700 dark:text-red-300 dark:focus:text-red-300"
              >
                <Trash2 className="mr-2 size-4" aria-hidden="true" />
                Arsipkan
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function PromotionTableRow(props: PromotionItemProps) {
  const { promotion, onOpen, busy } = props;
  const status = getPromotionOperationalStatus(promotion);
  const { typeLabel, detail } = getPromoTypeDetails(promotion);
  const budget = Number(promotion.promo_budget);
  const spent = Number(promotion.budget_spent);
  const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const attention = isPromotionAttention(promotion);
  const startDate = formatDate(promotion.start_at);
  const endDate = formatDate(promotion.end_at);

  return (
    <tr className="border-b transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="text-left font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              onClick={() => onOpen(promotion)}
              disabled={busy}
            >
              {promotion.name}
            </button>
            {promotion.code && (
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-mono">
                {promotion.code}
              </Badge>
            )}
            {attention && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400"
                title="Promosi perlu perhatian (defisit margin atau anggaran mendekati habis)"
              >
                <AlertTriangle className="size-3" aria-hidden="true" />
                Perhatian
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>Kanal: {promotion.applicable_channels.join(', ')}</span>
            {promotion.is_customer_required && <span>· Khusus member</span>}
          </div>
          {promotion.description && (
            <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">
              {promotion.description}
            </p>
          )}
          {promotion.planning_snapshot && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <PromotionHealth status={promotion.planning_snapshot.health_status} />
              <span className="text-[11px] text-muted-foreground">Estimasi tersimpan</span>
            </div>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="min-w-0">
          <span className="block text-sm font-medium">{typeLabel}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
          {Number(promotion.min_purchase_amount) > 0 && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Min. belanja Rp {Number(promotion.min_purchase_amount).toLocaleString('id-ID')}
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="min-w-0">
          <span className="block text-sm">
            {promotion.cost_basis === 'LATEST_HPP'
              ? 'Modal Masak Terakhir'
              : promotion.cost_basis === 'CURRENT_RECIPE'
              ? 'Harga Bahan Sekarang'
              : 'Belum diatur'}
          </span>
          {promotion.planning_snapshot?.unit_economics && (
            <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
              Untung Bersih:{' '}
              <CurrencyText
                value={promotion.planning_snapshot.unit_economics.gross_profit}
                allowDecimal
              />
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="min-w-0 space-y-1 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Anggaran:</span>
            <span className="font-medium tabular-nums">
              {budget === 0 ? 'Tanpa batas' : <CurrencyText value={promotion.promo_budget} />}
            </span>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            Terpakai <CurrencyText value={promotion.budget_spent} /> · {promotion.usage_count} transaksi
          </div>
          {budget > 0 && (
            <div className="w-full max-w-40 pt-0.5">
              <Progress
                value={percentage}
                aria-label={`Penggunaan anggaran ${promotion.name}`}
                className="h-1.5"
              />
            </div>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="min-w-0 space-y-1">
          <PromotionStatusBadge status={status} />
          {(startDate || endDate) && (
            <p className="text-[11px] text-muted-foreground">
              {startDate && endDate
                ? `${startDate} – ${endDate}`
                : startDate
                ? `Mulai ${startDate}`
                : `Hingga ${endDate}`}
            </p>
          )}
        </div>
      </td>

      <td className="w-12 px-2 py-3 text-right align-top">
        <PromotionActions {...props} />
      </td>
    </tr>
  );
}

export function PromotionCompactCard(props: PromotionItemProps) {
  const { promotion, onOpen, onToggle, canWrite, busy } = props;
  const status = getPromotionOperationalStatus(promotion);
  const { typeLabel, detail } = getPromoTypeDetails(promotion);
  const budget = Number(promotion.promo_budget);
  const spent = Number(promotion.budget_spent);
  const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const attention = isPromotionAttention(promotion);
  const startDate = formatDate(promotion.start_at);
  const endDate = formatDate(promotion.end_at);

  return (
    <Card className="min-w-0 overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-xs">
      <CardContent className="space-y-3 p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className="text-left text-sm font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                onClick={() => onOpen(promotion)}
                disabled={busy}
              >
                {promotion.name}
              </button>
              {promotion.code && (
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {promotion.code}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {typeLabel} · {promotion.applicable_channels.join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <PromotionStatusBadge status={status} />
            <PromotionActions {...props} />
          </div>
        </div>

        {promotion.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {promotion.description}
          </p>
        )}

        <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1.5">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Aturan:</span>
            <span className="font-medium text-right">{detail}</span>
          </div>
          {Number(promotion.min_purchase_amount) > 0 && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Min. Belanja:</span>
              <span>Rp {Number(promotion.min_purchase_amount).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Hitung Modal:</span>
            <span>
              {promotion.cost_basis === 'LATEST_HPP'
                ? 'Modal Masak Terakhir'
                : promotion.cost_basis === 'CURRENT_RECIPE'
                ? 'Harga Bahan Sekarang'
                : 'Belum diatur'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Anggaran:</span>
            <span className="font-medium tabular-nums">
              {budget === 0 ? 'Tanpa batas' : <CurrencyText value={promotion.promo_budget} />}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground tabular-nums">
            <span>Terpakai:</span>
            <span>
              <CurrencyText value={promotion.budget_spent} /> ({promotion.usage_count}x)
            </span>
          </div>
          {budget > 0 && (
            <Progress
              value={percentage}
              aria-label={`Pemakaian anggaran ${promotion.name}`}
              className="h-1.5"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs text-muted-foreground">
          <div>
            {promotion.planning_snapshot ? (
              <PromotionHealth status={promotion.planning_snapshot.health_status} />
            ) : attention ? (
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                <AlertTriangle className="size-3" />
                Perhatian
              </span>
            ) : (startDate || endDate) ? (
              <span>
                {startDate && endDate
                  ? `${startDate} – ${endDate}`
                  : startDate
                  ? `Mulai ${startDate}`
                  : `s.d. ${endDate}`}
              </span>
            ) : (
              <span>Tanpa batas jadwal</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpen(promotion)}
              disabled={busy}
            >
              {canWrite ? 'Ubah' : 'Lihat'}
            </Button>
            {canWrite && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onToggle(promotion)}
                disabled={busy}
              >
                {promotion.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromotionEmptyState({
  hasFilters,
  canCreate,
  onResetFilters,
  onCreate,
}: {
  hasFilters: boolean;
  canCreate: boolean;
  onResetFilters: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center">
      <Tag className="mx-auto mb-3 size-7 text-muted-foreground" aria-hidden="true" />
      <h2 className="font-semibold">
        {hasFilters ? 'Tidak ada promosi yang cocok' : 'Belum ada promosi'}
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? 'Ubah kata kunci atau reset filter untuk melihat promosi lainnya.'
          : 'Buat aturan promosi dan simulasikan laba kotornya sebelum diaktifkan.'}
      </p>
      {hasFilters ? (
        <Button variant="outline" className="mt-4 h-9 rounded-lg" onClick={onResetFilters}>
          Reset filter
        </Button>
      ) : (
        canCreate && (
          <Button className="mt-4 h-9 rounded-lg" onClick={onCreate}>
            <Plus className="mr-2 size-4" aria-hidden="true" />
            Tambah Promosi Pertama
          </Button>
        )
      )}
    </div>
  );
}
