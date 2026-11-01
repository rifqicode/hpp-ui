import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/use-auth-store';
import { usePromotionsMaster } from '@/features/promotions/hooks/use-promotions-master';
import { PromotionForm } from '@/features/promotions/components/promotion-form';
import { PromotionListHeader } from '@/features/promotions/components/promotion-list-header';
import { PromotionPageHeader } from '@/features/promotions/components/promotion-page-header';
import { PromotionListFilters } from '@/features/promotions/components/promotion-list-filters';
import { PromotionListStats } from '@/features/promotions/components/promotion-list-stats';
import {
  PromotionCompactCard,
  PromotionEmptyState,
  PromotionTableRow,
} from '@/features/promotions/components/promotion-list-items';
import {
  PROMO_SORTS,
  type PromotionAttentionFilter,
  type PromotionSort,
  type PromotionStatusFilter,
  type PromotionTypeFilter,
} from '@/features/promotions/lib/promotion-list';
import { promotionError } from '@/features/promotions/lib/promotion-form';
import PromotionDetailPage from './promotion-detail-page';
import { useIsMobile } from '@/hooks/use-mobile';

const STATUS_FILTERS: PromotionStatusFilter[] = ['all', 'active', 'inactive', 'scheduled', 'ended'];
const TYPE_FILTERS: PromotionTypeFilter[] = [
  'all',
  'DIRECT_DISCOUNT',
  'BUY_X_GET_Y',
  'BUNDLE',
  'SPECIAL_PRICE',
];
const ATTENTION_FILTERS: PromotionAttentionFilter[] = ['all', 'active', 'budget', 'attention'];

export default function PromotionsPage() {
  const storeId = useAuthStore(state => state.activeStoreId);
  const { promotionId } = useParams<{ promotionId: string }>();
  return storeId ? (
    <PromotionWorkspace
      key={`${storeId}:${promotionId || 'list'}`}
      storeId={storeId}
      promotionId={promotionId}
    />
  ) : (
    <div className="text-sm text-muted-foreground">Pilih toko untuk mengelola promosi.</div>
  );
}

function PromotionWorkspace({ storeId, promotionId }: { storeId: string; promotionId?: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const compact = useIsMobile(1280);
  const statusFilter = STATUS_FILTERS.find(value => value === searchParams.get('status')) || 'all';
  const typeFilter = TYPE_FILTERS.find(value => value === searchParams.get('type')) || 'all';
  const attentionFilter =
    ATTENTION_FILTERS.find(value => value === searchParams.get('attention')) || 'all';
  const sort =
    (Object.keys(PROMO_SORTS).find(value => value === searchParams.get('sort')) as
      PromotionSort | undefined) || 'created-desc';
  const view = searchParams.get('view') === 'grid' ? 'grid' : 'table';

  const updateFilters = (values: Record<string, string>, resetPage = true) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(values)) {
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) next.delete('page');
      return next;
    });
  };

  const openDetail = (promotion: { id: string }) =>
    navigate(`/sales/promotions/${promotion.id}${searchParams.size ? `?${searchParams}` : ''}`);
  const master = usePromotionsMaster(
    storeId,
    {
      status: statusFilter,
      type: typeFilter,
      attention: attentionFilter,
      sort,
    },
    !promotionId,
  );

  const names = useMemo(() => {
    const result = new Map<string, string>(Object.entries(master.editor?.catalogNames || {}));
    for (const line of master.editor?.snapshot?.lines || []) {
      if (!result.has(line.variant_id)) result.set(line.variant_id, line.name);
    }
    return result;
  }, [master.editor?.catalogNames, master.editor?.snapshot]);

  const rawList = master.list.data?.data || [];

  const hasFilters = Boolean(
    master.search || statusFilter !== 'all' || typeFilter !== 'all' || attentionFilter !== 'all',
  );

  const displayedItems = rawList;
  const filteredCount = master.list.data?.total ?? 0;
  const pageSize = master.list.data?.per_page ?? 12;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  const resetFilters = () => {
    updateFilters({ q: '', status: '', type: '', attention: '' });
  };

  if (!master.canRead) {
    return (
      <div role="alert" className="text-sm">
        Anda tidak memiliki izin untuk melihat master promosi.
      </div>
    );
  }

  const handleUpgrade = () => {
    window.dispatchEvent(
      new CustomEvent('open-upgrade-modal', {
        detail: { message: 'Tingkatkan paket Anda untuk menambah kapasitas promosi aktif.' },
      }),
    );
  };

  const editor = master.editor;
  const disabled = master.busy || Boolean(editor?.readOnly) || !master.canWrite;

  if (promotionId && !editor) {
    return (
      <PromotionDetailPage
        storeId={storeId}
        promotionId={promotionId}
        onEdit={promotion => void master.open(promotion, false)}
        busy={master.busy}
        actionError={master.error}
      />
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5 pb-6">
      {editor ? (
        <PromotionPageHeader
          title={editor.readOnly ? 'Detail Promosi' : editor.id ? 'Ubah Promosi' : 'Tambah Promosi'}
          description={
            editor.readOnly
              ? 'Lihat konfigurasi aturan, dasar HPP, dan simulasi proyeksi laba kotor promosi.'
              : 'Atur persyaratan dan anggaran, lalu periksa dampaknya pada laba kotor.'
          }
          onBack={master.closeEditor}
          disabled={master.busy}
        />
      ) : (
        <PromotionListHeader
          onRefresh={() => void master.refetchList()}
          onCreate={master.create}
          isFetching={master.list.isFetching || master.summary.isFetching}
          busy={master.busy}
          canWrite={master.canWrite}
          activeCount={master.list.data?.active_count ?? 0}
          maxActive={master.list.data?.max_active_promotions ?? -1}
          onUpgrade={handleUpgrade}
        />
      )}

      {master.error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {master.error}
        </div>
      )}

      {master.success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {master.success}
        </div>
      )}

      {editor ? (
        <PromotionForm
          input={editor.input}
          onChange={master.updateInput}
          names={names}
          disabled={disabled}
          readOnly={Boolean(editor.readOnly)}
          canWrite={master.canWrite}
          busy={master.busy}
          onCancel={master.closeEditor}
          onSave={master.save}
          simulation={master.simulation}
          simulationLoading={master.simulationLoading}
          simulationError={master.simulationError}
          readiness={master.readiness}
          retrySimulation={() => void master.retrySimulation()}
        />
      ) : (
        <div className="space-y-4">
          <PromotionListStats
            summary={master.summary.data}
            isLoading={master.summary.isPending}
            isError={master.summary.isError}
            onRetry={() => void master.summary.refetch()}
          />
          <PromotionListFilters
            search={master.search}
            onSearchChange={master.setSearch}
            status={statusFilter}
            onStatusChange={status => updateFilters({ status, attention: 'all' })}
            type={typeFilter}
            onTypeChange={type => updateFilters({ type })}
            sort={sort}
            onSortChange={sort => updateFilters({ sort })}
            view={view}
            onViewChange={view => updateFilters({ view }, false)}
            filteredCount={filteredCount}
            hasFilters={hasFilters}
            onResetFilters={resetFilters}
            isLoading={master.list.isPending}
            isFetching={master.list.isFetching}
            isError={master.list.isError}
          />

          {master.list.isPending ? (
            <div
              role="status"
              aria-label="Memuat daftar promosi"
              className="space-y-2 rounded-xl border p-3"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : master.list.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-card p-6 text-center"
            >
              <p className="font-semibold text-destructive">Gagal memuat promosi</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {promotionError(master.list.error)}
              </p>
              <Button
                variant="outline"
                className="mt-3 h-11"
                onClick={() => void master.list.refetch()}
                disabled={master.list.isFetching}
              >
                Coba lagi
              </Button>
            </div>
          ) : displayedItems.length === 0 ? (
            <PromotionEmptyState
              hasFilters={hasFilters}
              canCreate={master.canWrite}
              onResetFilters={resetFilters}
              onCreate={master.create}
            />
          ) : (
            <section
              aria-label="Daftar promosi"
              aria-busy={master.list.isFetching}
              className="space-y-3"
            >
              {view === 'table' && !compact ? (
                <div className="rounded-xl border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm" aria-label="Tabel promosi">
                      <thead className="border-b text-xs font-medium text-muted-foreground">
                        <tr>
                          <th scope="col" className="w-[38%] px-5 py-4">
                            Promosi
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Periode
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Pemakaian anggaran
                          </th>
                          <th scope="col" className="w-auto px-4 py-3 text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedItems.map(promotion => (
                          <PromotionTableRow
                            key={promotion.id}
                            promotion={promotion}
                            canWrite={master.canWrite}
                            canDelete={master.canDelete}
                            busy={master.busy}
                            onOpen={openDetail}
                            onEdit={promotion => void master.open(promotion, false)}
                            onToggle={master.toggle}
                            onArchive={master.setArchiveTarget}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                  aria-label="Kartu promosi"
                >
                  {displayedItems.map(promotion => (
                    <PromotionCompactCard
                      key={promotion.id}
                      promotion={promotion}
                      canWrite={master.canWrite}
                      canDelete={master.canDelete}
                      busy={master.busy}
                      onOpen={openDetail}
                      onEdit={promotion => void master.open(promotion, false)}
                      onToggle={master.toggle}
                      onArchive={master.setArchiveTarget}
                    />
                  ))}
                </div>
              )}

              {filteredCount > pageSize && (
                <TablePagination
                  total={filteredCount}
                  displayedCount={displayedItems.length}
                  page={master.page}
                  totalPages={totalPages}
                  disabled={master.list.isFetching || master.busy}
                  label="promosi"
                  onPrev={() => master.setPage(p => Math.max(1, p - 1))}
                  onNext={() => master.setPage(p => Math.min(totalPages, p + 1))}
                />
              )}
            </section>
          )}
        </div>
      )}

      {/* Confirmation modal for margin deficit */}
      <Dialog
        open={Boolean(master.pending)}
        onOpenChange={open => {
          if (!open) master.dismissRisk();
        }}
      >
        <DialogContent
          showCloseButton={!master.busy}
          closeButtonClassName="flex h-11 w-11 items-center justify-center right-2 top-2"
        >
          <DialogHeader>
            <DialogTitle>Konfirmasi promo dengan estimasi rugi</DialogTitle>
            <DialogDescription>
              Simulasi terbaru menghasilkan rugi kotor. Periksa nominalnya dan pastikan risiko ini
              sesuai dengan anggaran promosi sebelum mengaktifkan.
            </DialogDescription>
          </DialogHeader>
          {master.pending && (
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimasi laba kotor per transaksi:</span>
                <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                  <CurrencyText
                    value={master.pending.simulation.unit_economics.gross_profit}
                    allowDecimal
                  />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modal bahan baku per transaksi:</span>
                <span className="font-medium tabular-nums">
                  <CurrencyText
                    value={master.pending.simulation.unit_economics.total_cogs}
                    allowDecimal
                  />
                </span>
              </div>
            </div>
          )}
          {master.error && (
            <p role="alert" className="text-sm text-destructive">
              {master.error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="h-11"
              disabled={master.busy}
              onClick={master.dismissRisk}
            >
              Tinjau Kembali
            </Button>
            <Button
              className="h-11"
              disabled={master.busy || !master.canWrite}
              onClick={() => void master.confirmRisk()}
            >
              {master.busy ? 'Menyimpan…' : 'Saya memahami, aktifkan promosi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirmation modal */}
      <Dialog
        open={Boolean(master.archiveTarget)}
        onOpenChange={open => {
          if (!open) master.dismissArchive();
        }}
      >
        <DialogContent
          showCloseButton={!master.busy}
          closeButtonClassName="flex h-11 w-11 items-center justify-center right-2 top-2"
        >
          <DialogHeader>
            <DialogTitle>Arsipkan promosi?</DialogTitle>
            <DialogDescription>
              Promosi “{master.archiveTarget?.name}” akan diarsipkan dari daftar aktif. Riwayat
              transaksi yang telah menggunakan promosi ini tetap aman tersimpan.
            </DialogDescription>
          </DialogHeader>
          {master.error && (
            <p role="alert" className="text-sm text-destructive">
              {master.error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="h-11"
              disabled={master.busy}
              onClick={master.dismissArchive}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={master.busy || !master.canDelete}
              onClick={() => void master.archive()}
            >
              {master.busy ? 'Mengarsipkan…' : 'Ya, arsipkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
