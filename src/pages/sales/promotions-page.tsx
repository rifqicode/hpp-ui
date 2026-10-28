import { useMemo, useState } from 'react';
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
import { PromotionListStats } from '@/features/promotions/components/promotion-list-stats';
import { PromotionListFilters } from '@/features/promotions/components/promotion-list-filters';
import {
  PromotionCompactCard,
  PromotionEmptyState,
  PromotionTableRow,
} from '@/features/promotions/components/promotion-list-items';
import {
  getPromotionMetrics,
  type PromotionAttentionFilter,
  type PromotionSort,
  type PromotionStatusFilter,
  type PromotionTypeFilter,
} from '@/features/promotions/lib/promotion-list';
import { promotionError } from '@/features/promotions/lib/promotion-form';

export default function PromotionsPage() {
  const storeId = useAuthStore((state) => state.activeStoreId);
  return storeId ? (
    <PromotionWorkspace key={storeId} storeId={storeId} />
  ) : (
    <div className="p-6 text-sm text-muted-foreground">Pilih toko untuk mengelola promosi.</div>
  );
}

function PromotionWorkspace({ storeId }: { storeId: string }) {
  // Filters, search, sort, and view states
  const [statusFilter, setStatusFilter] = useState<PromotionStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<PromotionTypeFilter>('all');
  const [attentionFilter, setAttentionFilter] = useState<PromotionAttentionFilter>('all');
  const [sort, setSort] = useState<PromotionSort>('created-desc');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const master = usePromotionsMaster(storeId, {
    status: statusFilter, type: typeFilter, attention: attentionFilter, sort,
  });

  const names = useMemo(() => {
    const result = new Map<string, string>();
    for (const option of master.options.data?.data || []) {
      result.set(option.id, option.name);
      result.set(option.product_id, option.product_name);
      result.set(option.category_id, option.category_name);
    }
    for (const line of master.editor?.snapshot?.lines || []) {
      if (!result.has(line.variant_id)) result.set(line.variant_id, line.name);
    }
    return result;
  }, [master.options.data, master.editor?.snapshot]);

  const rawList = master.list.data?.data || [];
  const metrics = useMemo(() => getPromotionMetrics(rawList), [rawList]);

  const stats = useMemo(
    () => ({
      total: master.list.data?.total || rawList.length,
      active: master.list.data?.active_count ?? metrics.active,
      budgetSpent: metrics.budgetSpent,
      attention: metrics.attention,
    }),
    [master.list.data, rawList.length, metrics]
  );

  const hasFilters = Boolean(
    master.search ||
      statusFilter !== 'all' ||
      typeFilter !== 'all' ||
      attentionFilter !== 'all'
  );

  const displayedItems = rawList;
  const filteredCount = master.list.data?.total ?? 0;
  const pageSize = master.list.data?.per_page ?? 12;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  const resetFilters = () => {
    master.setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setAttentionFilter('all');
    master.setPage(1);
  };

  const handleStatCardFilter = (filter: PromotionAttentionFilter) => {
    setAttentionFilter(filter);
    if (filter === 'active') {
      setStatusFilter('active');
    } else if (filter === 'all') {
      setStatusFilter('all');
    }
    master.setPage(1);
  };

  if (!master.canRead) {
    return (
      <div role="alert" className="p-6 text-sm">
        Anda tidak memiliki izin untuk melihat master promosi.
      </div>
    );
  }

  const handleUpgrade = () => {
    window.dispatchEvent(
      new CustomEvent('open-upgrade-modal', {
        detail: { message: 'Tingkatkan paket Anda untuk menambah kapasitas promosi aktif.' },
      })
    );
  };

  const editor = master.editor;
  const disabled = master.busy || Boolean(editor?.readOnly) || !master.canWrite;

  return (
    <div className="w-full min-w-0 space-y-5 p-3 sm:p-6">
      {editor ? (
        <PromotionPageHeader
          title={
            editor.readOnly
              ? 'Detail Promosi'
              : editor.id
              ? 'Ubah Promosi'
              : 'Tambah Promosi'
          }
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
          onRefresh={() => void master.list.refetch()}
          onCreate={master.create}
          isFetching={master.list.isFetching}
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
          options={master.options.data?.data || []}
          optionsQuery={master.options}
          optionSearch={master.optionSearch}
          onOptionSearchChange={master.setOptionSearch}
          optionPage={master.optionPage}
          onOptionPageChange={master.setOptionPage}
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
          existingPromotion={rawList.find((p) => p.id === editor.id)}
        />
      ) : (
        <div className="space-y-4">
          <PromotionListStats
            stats={stats}
            activeFilter={attentionFilter}
            hasFilters={hasFilters}
            onSelectFilter={handleStatCardFilter}
            isLoading={master.list.isPending}
            isError={master.list.isError}
          />

          <PromotionListFilters
            search={master.search}
            onSearchChange={(val) => {
              master.setSearch(val);
              master.setPage(1);
            }}
            status={statusFilter}
            onStatusChange={(val) => {
              setStatusFilter(val);
              master.setPage(1);
            }}
            type={typeFilter}
            onTypeChange={(val) => {
              setTypeFilter(val);
              master.setPage(1);
            }}
            sort={sort}
            onSortChange={(value) => { setSort(value); master.setPage(1); }}
            view={view}
            onViewChange={setView}
            filteredCount={filteredCount}
            totalCount={stats.total}
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
              {view === 'table' ? (
                <div className="overflow-hidden rounded-xl border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" aria-label="Tabel promosi">
                      <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-4 py-3">
                            Promosi
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Model Promo
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Hitung Modal
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Batas Anggaran & Transaksi
                          </th>
                          <th scope="col" className="px-3 py-3">
                            Status
                          </th>
                          <th scope="col" className="w-auto px-4 py-3 text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedItems.map((promotion) => (
                          <PromotionTableRow
                            key={promotion.id}
                            promotion={promotion}
                            canWrite={master.canWrite}
                            canDelete={master.canDelete}
                            busy={master.busy}
                            onOpen={master.open}
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
                  {displayedItems.map((promotion) => (
                    <PromotionCompactCard
                      key={promotion.id}
                      promotion={promotion}
                      canWrite={master.canWrite}
                      canDelete={master.canDelete}
                      busy={master.busy}
                      onOpen={master.open}
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
                  onPrev={() => master.setPage((p) => Math.max(1, p - 1))}
                  onNext={() => master.setPage((p) => Math.min(totalPages, p + 1))}
                />
              )}
            </section>
          )}
        </div>
      )}

      {/* Confirmation modal for margin deficit */}
      <Dialog
        open={Boolean(master.pending)}
        onOpenChange={(open) => {
          if (!open) master.dismissRisk();
        }}
      >
        <DialogContent
          showCloseButton={!master.busy}
          closeButtonClassName="flex h-11 w-11 items-center justify-center right-2 top-2"
        >
          <DialogHeader>
            <DialogTitle>Konfirmasi strategi penetrasi pasar</DialogTitle>
            <DialogDescription>
              Promosi ini menghasilkan defisit margin pada simulasi terbaru. Pastikan biaya
              tersebut telah sesuai dengan anggaran dan tujuan strategi promosi Anda.
            </DialogDescription>
          </DialogHeader>
          {master.pending && (
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keuntungan bersih per transaksi:</span>
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
        onOpenChange={(open) => {
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
