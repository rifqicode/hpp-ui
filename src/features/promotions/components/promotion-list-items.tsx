import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  getPromotionOperationalStatus,
  type PromotionOperationalStatus,
} from '../lib/promotion-list';
import { PromotionCurrencyText } from './promotion-currency';
import type { Promotion } from '../types';

interface PromotionItemProps {
  promotion: Promotion;
  canWrite: boolean;
  canDelete: boolean;
  busy: boolean;
  onOpen: (promotion: Promotion) => void;
  onEdit: (promotion: Promotion) => void;
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
    default:
      return <Badge variant="secondary">Nonaktif</Badge>;
  }
}

function formatDate(value: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function PromotionRule({ promotion }: { promotion: Promotion }) {
  switch (promotion.promo_type) {
    case 'DIRECT_DISCOUNT':
      return (
        <>
          Potongan{' '}
          {promotion.discount_type === 'PERCENTAGE' ? (
            `${Number(promotion.discount_value).toLocaleString('id-ID', { maximumFractionDigits: 4 })}%`
          ) : (
            <PromotionCurrencyText value={promotion.discount_value} />
          )}{' '}
          untuk {promotion.scope === 'BILL' ? 'total tagihan' : 'menu tertentu'}
        </>
      );
    case 'BUY_X_GET_Y':
      return <>Beli menu persyaratan, dapat bonus gratis</>;
    case 'BUNDLE':
      return (
        <>
          Paket hemat <PromotionCurrencyText value={promotion.bundle_price} />
        </>
      );
    case 'SPECIAL_PRICE':
      return (
        <>
          Tebus murah dengan minimum belanja{' '}
          <PromotionCurrencyText value={promotion.min_purchase_amount} />
        </>
      );
  }
}

function PromotionIdentity({ promotion, busy }: { promotion: Promotion; busy: boolean }) {
  const location = useLocation();
  return (
    <div className="min-w-0 space-y-1.5">
      <Link
        to={`/sales/promotions/${promotion.id}${location.search}`}
        aria-disabled={busy || undefined}
        tabIndex={busy ? -1 : undefined}
        onClick={event => {
          if (busy) event.preventDefault();
        }}
        className="inline-block break-words rounded-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring [overflow-wrap:anywhere]"
      >
        {promotion.name}
      </Link>
      <p className="text-sm leading-6 text-muted-foreground">
        <PromotionRule promotion={promotion} />
      </p>
      <p className="break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
        {promotion.code && <>Kode {promotion.code} · </>}
        {promotion.applicable_channels
          .map(channel => (channel === 'POS' ? 'Kasir POS' : 'Online'))
          .join(' · ')}
      </p>
    </div>
  );
}

function PromotionPeriod({ promotion }: { promotion: Promotion }) {
  const start = formatDate(promotion.start_at);
  const end = formatDate(promotion.end_at);
  return (
    <div className="space-y-1 text-sm leading-5">
      {start && <p>Mulai {start}</p>}
      {end && <p className="text-muted-foreground">Hingga {end}</p>}
      {!start && !end && <p className="text-muted-foreground">Tanpa batas periode</p>}
    </div>
  );
}

function PromotionWarnings({ promotion }: { promotion: Promotion }) {
  const budget = Number(promotion.promo_budget);
  const ratio = budget > 0 ? Number(promotion.budget_spent) / budget : 0;
  const warnings = [
    ...(ratio >= 1 ? ['Anggaran habis'] : ratio >= 0.9 ? ['Anggaran hampir habis'] : []),
    ...(promotion.planning_snapshot?.health_status === 'MARGIN_DEFICIT'
      ? ['Estimasi rugi kotor']
      : []),
  ];
  if (!warnings.length) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-amber-700 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{warnings.join(' · ')}</span>
    </p>
  );
}

function PromotionUsage({ promotion }: { promotion: Promotion }) {
  const budget = Number(promotion.promo_budget);
  const percentage =
    budget > 0 ? Math.min(100, Math.max(0, (Number(promotion.budget_spent) / budget) * 100)) : 0;
  return (
    <div className="min-w-0 space-y-2 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 tabular-nums">
        <span className="font-medium">
          <PromotionCurrencyText value={promotion.budget_spent} />
        </span>
        {budget > 0 && (
          <span className="text-xs text-muted-foreground">
            dari <PromotionCurrencyText value={promotion.promo_budget} />
          </span>
        )}
      </p>
      {budget > 0 ? (
        <Progress
          value={percentage}
          className="h-1.5"
          aria-label={`Pemakaian anggaran ${promotion.name}`}
        />
      ) : (
        <p className="text-xs text-muted-foreground">Tanpa batas anggaran</p>
      )}
      <p className="text-xs text-muted-foreground">
        {promotion.usage_count.toLocaleString('id-ID')} transaksi memakai promo
      </p>
    </div>
  );
}

export function PromotionActions({
  promotion,
  canWrite,
  canDelete,
  busy,
  onOpen,
  onEdit,
  onToggle,
  onArchive,
}: PromotionItemProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aksi untuk ${promotion.name}`}
          className="size-11 shrink-0 sm:size-10"
          disabled={busy}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="min-h-11" onClick={() => onOpen(promotion)}>
          Lihat detail
        </DropdownMenuItem>
        {canWrite && (
          <>
            <DropdownMenuItem className="min-h-11" onClick={() => onEdit(promotion)}>
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onClick={() => onToggle(promotion)}>
              {promotion.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </DropdownMenuItem>
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onArchive(promotion)}
              className="min-h-11 text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" aria-hidden="true" />
              Arsipkan
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PromotionTableRow(props: PromotionItemProps) {
  const { promotion, busy } = props;
  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/20">
      <td className="px-5 py-5 align-top">
        <PromotionIdentity promotion={promotion} busy={busy} />
      </td>
      <td className="px-3 py-5 align-top">
        <PromotionStatusBadge status={getPromotionOperationalStatus(promotion)} />
        <PromotionWarnings promotion={promotion} />
      </td>
      <td className="px-3 py-5 align-top">
        <PromotionPeriod promotion={promotion} />
      </td>
      <td className="px-3 py-5 align-top">
        <PromotionUsage promotion={promotion} />
      </td>
      <td className="px-3 py-3 text-right align-top">
        <PromotionActions {...props} />
      </td>
    </tr>
  );
}

export function PromotionCompactCard(props: PromotionItemProps) {
  const { promotion, busy } = props;
  return (
    <article
      aria-label={promotion.name}
      className="flex min-w-0 flex-col rounded-xl border bg-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <PromotionIdentity promotion={promotion} busy={busy} />
        <PromotionActions {...props} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PromotionStatusBadge status={getPromotionOperationalStatus(promotion)} />
        <PromotionWarnings promotion={promotion} />
      </div>
      <div className="my-4">
        <PromotionPeriod promotion={promotion} />
      </div>
      <div className="mt-auto border-t pt-4">
        <p className="mb-2 text-xs text-muted-foreground">Anggaran terpakai</p>
        <PromotionUsage promotion={promotion} />
      </div>
    </article>
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
    <div className="rounded-xl border bg-card px-4 py-12 text-center">
      <h2 className="font-semibold">
        {hasFilters ? 'Tidak ada promosi yang cocok' : 'Belum ada promosi'}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? 'Ubah kata kunci atau reset filter untuk melihat promosi lainnya.'
          : 'Buat promo pertama, lalu periksa estimasi laba kotornya sebelum diaktifkan.'}
      </p>
      {hasFilters ? (
        <Button variant="outline" className="mt-5 h-11" onClick={onResetFilters}>
          Reset filter
        </Button>
      ) : (
        canCreate && (
          <Button className="mt-5 h-11" onClick={onCreate}>
            <Plus className="mr-2 size-4" aria-hidden="true" />
            Tambah Promosi Pertama
          </Button>
        )
      )}
    </div>
  );
}
