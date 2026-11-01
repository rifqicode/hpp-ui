import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MoreVertical,
  Check,
  RotateCcw,
  Loader2,
  RefreshCw,
  X,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyText } from '@/components/ui/currency-text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuotaBadge } from '@/features/subscription';
import { FeatureGuidanceTour, GuidanceTourTrigger } from '@/features/guidance';
import { ProductionKanban } from '@/features/production/components/production-kanban';
import { ProductionStatusBadge } from '@/features/production/components/production-status';
import { useProductionBatchActions } from '@/features/production/components/production-batch-actions';
import { productionBatchService } from '@/features/production/services/production-batch-service';
import { presentProductionHead } from '@/features/production/services/production-batch-presentation';
import type { ProductionBatch } from '@/features/production/types';
import { useAuthStore } from '@/store/use-auth-store';
import { usePermission } from '@/hooks/use-permission';

function formatBatchDate(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function isFinished(batch: ProductionBatch) {
  return batch.status === 'COMPLETED' || batch.status === 'VOID';
}
function renderBatchSourceBadge(batch: ProductionBatch) {
  const source = batch.source || (batch.saleId ? 'POS' : 'MANUAL');
  const label = source === 'POS' ? 'POS' : source === 'ONLINE' ? 'Online' : 'Manual';
  const badgeClass =
    source === 'POS'
      ? 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
      : source === 'ONLINE'
        ? 'border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300'
        : 'border-border bg-muted/60 text-muted-foreground';
  return (
    <Badge
      variant="outline"
      className={`px-1.5 py-0 text-[10px] font-semibold leading-4 ${badgeClass}`}
    >
      {label}
    </Badge>
  );
}

export default function BatchListPage() {
  const navigate = useNavigate();
  const [viewParams, setViewParams] = useSearchParams();
  const activeView = viewParams.get('tab') === 'list' ? 'list' : 'kanban';
  const storeId = useAuthStore(state => state.activeStoreId);
  const { can } = usePermission();
  const canWrite = can('production:write');
  const queryClient = useQueryClient();
  const {
    data: heads = [],
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch: refetchBatches,
  } = useQuery({
    queryKey: ['production', storeId, 'heads'],
    queryFn: productionBatchService.list,
    enabled: Boolean(storeId),
  });
  const actions = useProductionBatchActions(head => {
    queryClient.setQueryData(['production', storeId, 'head', head.id], head);
    void queryClient.invalidateQueries({ queryKey: ['production'] });
    void queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
  });
  const batches = React.useMemo(
    () =>
      heads.map(head => {
        const isManual = head.source === 'MANUAL';
        const manualAlertEnabled =
          actions.settings?.enable_manual_timer_alert ??
          actions.settings?.enable_kds_timer_alert ??
          false;
        return {
          ...presentProductionHead(head),
          timerAlert: {
            enabled: isManual
              ? Boolean(manualAlertEnabled && head.target_completed_at)
              : Boolean(actions.settings?.enable_kds_timer_alert),
            warningLeadMinutes: isManual
              ? Math.max(1, actions.settings?.manual_warning_lead_minutes ?? 15)
              : Math.max(
                  0,
                  (actions.settings?.late_time_minutes ?? 15) -
                    (actions.settings?.warning_time_minutes ?? 12),
                ),
          },
        };
      }),
    [heads, actions.settings],
  );
  const returnTo = `/production/batches?${viewParams.toString()}`;
  const pickingUp = actions.busy ? 'busy' : null;
  const actionError = '';
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const stats = {
    queuedCount: batches.filter(b => b.status === 'QUEUED').length,
    activeCount: batches.filter(b => b.status === 'IN_PROGRESS').length,
    completedCount: batches.filter(b => b.status === 'COMPLETED').length,
  };
  const filteredBatches = batches.filter(b => {
    const text = `${b.batchNumber} ${b.productName} ${b.notes || ''} ${b.productionItems?.map(item => item.productName).join(' ')}`;
    return (
      text.toLowerCase().includes(search.trim().toLowerCase()) &&
      (statusFilter === 'ALL' || b.status === statusFilter)
    );
  });
  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  function handlePickupBatch(id: string) {
    if (!canWrite || actions.busy) return;
    const head = heads.find(head => head.id === id);
    if (!head) return;
    if (head.status === 'DRAFT') navigate(`/production/batches/${id}`, { state: { returnTo } });
    else actions.begin(head);
  }
  function openCompleteDialog(batch: ProductionBatch) {
    if (!canWrite || actions.busy) return;
    const head = heads.find(head => head.id === batch.id);
    if (head) actions.complete(head);
  }
  function openCompleteItemDialog(batch: ProductionBatch, itemId: string) {
    if (!canWrite || actions.busy) return;
    const head = heads.find(head => head.id === batch.id);
    const log = head?.logs.find(item => item.id === itemId && item.status === 'IN_PROGRESS');
    if (head && head.status === 'IN_PROGRESS' && log) actions.complete(head, [log]);
  }
  function renderBatchActions(batch: ProductionBatch) {
    const head = heads.find(head => head.id === batch.id);
    return (
      <div className="flex items-center justify-end gap-2">
        {canWrite && (batch.status === 'QUEUED' || batch.status === 'DRAFT') ? (
          <Button
            size="sm"
            disabled={actions.busy}
            onClick={() => handlePickupBatch(batch.id)}
            className="mr-auto lg:mr-0"
          >
            {batch.status === 'DRAFT' ? 'Edit draft' : 'Mulai proses'}
          </Button>
        ) : canWrite && batch.status === 'IN_PROGRESS' ? (
          <Button
            size="sm"
            disabled={actions.busy}
            onClick={() => openCompleteDialog(batch)}
            className="mr-auto lg:mr-0"
          >
            <Check className="mr-1 h-4 w-4" />
            Selesaikan
          </Button>
        ) : null}
        <Button variant="outline" size="sm" asChild>
          <Link to={`/production/batches/${batch.id}`} state={{ returnTo }}>
            Detail
          </Link>
        </Button>
        {canWrite && head && ['DRAFT', 'QUEUED', 'IN_PROGRESS'].includes(batch.status) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Aksi lainnya untuk ${batch.batchNumber}`}
                className="h-9 w-9"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/production/batches/${batch.id}`, { state: { returnTo } })}
              >
                Lihat rincian
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.cancel(head)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Batalkan batch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="shrink-0 p-2 rounded-xl bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Produksi
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelola antrian, pantau progres, dan catat hasil produksi.
            </p>
            <QuotaBadge resource="batches" label="Kuota produksi bulanan" />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <GuidanceTourTrigger feature="production" />
          {(activeView === 'list' || activeView === 'kanban') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBatches()}
              disabled={isFetching}
              className="flex items-center gap-1.5 shadow-2xs hover:bg-muted flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Perbarui
            </Button>
          )}
          {canWrite && (
            <Button
              data-guidance="new-batch-btn"
              onClick={() => navigate('/production/batches/new')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4" />
              Mulai Batch Baru
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeView}
        onValueChange={value =>
          setViewParams(current => {
            const next = new URLSearchParams(current);
            next.set('tab', value);
            return next;
          })
        }
      >
        <TabsList
          data-guidance="production-view-tabs"
          aria-label="Tampilan produksi"
          className="mb-4 grid w-full max-w-md grid-flow-col auto-cols-fr"
        >
          {[
            { value: 'kanban', label: 'Papan Kanban' },
            { value: 'list', label: 'Daftar Tabel' },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="kanban" className="space-y-4">
          {actionError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {actionError}
            </div>
          )}
          {loading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-3 p-16 text-sm text-muted-foreground"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat papan kanban produksi…
            </div>
          ) : queryError ? (
            <div role="alert" className="space-y-3 p-10 text-center">
              <p>Data produksi belum berhasil dimuat.</p>
              <Button variant="outline" onClick={() => void refetchBatches()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            <ProductionKanban
              batches={filteredBatches}
              canAct={canWrite}
              onPickup={handlePickupBatch}
              onComplete={openCompleteDialog}
              onCompleteItem={openCompleteItemDialog}
              isPickingUp={pickingUp}
            />
          )}
        </TabsContent>
        <TabsContent value="list" className="space-y-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Ringkasan produksi">
            {[
              {
                status: 'ALL',
                label: 'Semua batch',
                count: batches.length,
                icon: History,
                color: 'text-primary',
                description: 'Seluruh riwayat produksi',
              },
              {
                status: 'QUEUED',
                label: 'Antrian',
                count: stats.queuedCount,
                icon: Clock,
                color: 'text-violet-600 dark:text-violet-400',
                description: 'Siap untuk mulai diproses',
              },
              {
                status: 'IN_PROGRESS',
                label: 'Sedang berjalan',
                count: stats.activeCount,
                icon: RefreshCw,
                color: 'text-amber-600 dark:text-amber-400',
                description: 'Menunggu hasil produksi',
              },
              {
                status: 'COMPLETED',
                label: 'Selesai',
                count: stats.completedCount,
                icon: CheckCircle2,
                color: 'text-emerald-600 dark:text-emerald-400',
                description: 'Hasil dan HPP sudah tercatat',
              },
            ].map(item => (
              <button
                key={item.status}
                type="button"
                aria-pressed={statusFilter === item.status}
                onClick={() => {
                  setStatusFilter(item.status);
                  setPage(1);
                }}
                className={`rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === item.status ? 'border-primary/50 ring-1 ring-primary/15' : 'border-border'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                </div>
                <p
                  className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${item.color}`}
                >
                  {loading ? '—' : item.count}
                </p>
                <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                  {item.description}
                </p>
              </button>
            ))}
          </div>

          <section
            className="overflow-hidden rounded-xl border bg-card"
            aria-label="Daftar batch produksi"
          >
            <div className="space-y-4 border-b p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">Daftar batch</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pantau progres dan catat hasil produksi dari satu tempat.
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    aria-label="Cari batch produksi"
                    placeholder="Cari batch, produk, atau catatan…"
                    value={search}
                    onChange={event => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    className="h-10 pl-9 pr-9"
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Hapus pencarian"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Filter status batch">
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'QUEUED', label: 'Antrian' },
                  { key: 'IN_PROGRESS', label: 'Berjalan' },
                  { key: 'COMPLETED', label: 'Selesai' },
                  { key: 'DRAFT', label: 'Draft' },
                  { key: 'CANCELLED', label: 'Batal / Void' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={statusFilter === item.key}
                    onClick={() => {
                      setStatusFilter(item.key);
                      setPage(1);
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === item.key ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {actionError && (
              <div
                role="alert"
                className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {actionError}
              </div>
            )}
            {loading ? (
              <div
                role="status"
                className="flex items-center justify-center gap-3 p-16 text-sm text-muted-foreground"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Memuat batch produksi…
              </div>
            ) : queryError ? (
              <div role="alert" className="space-y-3 p-10 text-center">
                <p>Data produksi belum berhasil dimuat.</p>
                <Button variant="outline" onClick={() => void refetchBatches()}>
                  Coba lagi
                </Button>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="mb-4 rounded-2xl bg-muted p-4">
                  <History className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">
                  {search || statusFilter !== 'ALL'
                    ? 'Batch tidak ditemukan'
                    : 'Belum ada batch produksi'}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {search || statusFilter !== 'ALL'
                    ? 'Coba kata kunci lain atau hapus filter untuk melihat semua batch.'
                    : 'Buat batch pertama untuk mulai mencatat hasil produksi dan biaya per unit.'}
                </p>
                <Button
                  className="mt-5"
                  variant={search || statusFilter !== 'ALL' ? 'outline' : 'default'}
                  onClick={() => {
                    if (search || statusFilter !== 'ALL') {
                      setSearch('');
                      setStatusFilter('ALL');
                      setPage(1);
                    } else navigate('/production/batches/new');
                  }}
                >
                  {search || statusFilter !== 'ALL' ? 'Reset filter' : 'Mulai batch pertama'}
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y lg:hidden">
                  {paginatedBatches.map(batch => (
                    <article key={batch.id} className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/production/batches/${batch.id}`}
                            state={{ returnTo }}
                            className="block truncate font-semibold hover:text-primary hover:underline"
                          >
                            {batch.productName}
                          </Link>
                          {batch.productionItems && batch.productionItems.length > 1 && (
                            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                              {batch.productionItems.map(item => (
                                <li key={item.id}>
                                  {item.productName} · {item.targetQuantity} {item.productUnit}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-mono text-muted-foreground">
                              {batch.batchNumber}
                            </span>
                            {renderBatchSourceBadge(batch)}
                          </div>
                        </div>
                        <ProductionStatusBadge status={batch.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatBatchDate(batch.startedAt)}
                      </p>
                      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">
                            {isFinished(batch) ? 'Hasil / target' : 'Target produksi'}
                          </p>
                          <p className="font-medium tabular-nums">
                            {isFinished(batch) ? `${batch.goodQuantity ?? 0} / ` : ''}
                            {batch.targetQuantity} {batch.productUnit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="mb-1 text-xs text-muted-foreground">HPP per unit</p>
                          {isFinished(batch) ? (
                            <>
                              {batch.productionItems && batch.productionItems.length > 1 ? (
                                <span className="text-xs text-muted-foreground">
                                  Lihat per varian
                                </span>
                              ) : batch.hppPerUnit ? (
                                <CurrencyText value={batch.hppPerUnit} />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum final</span>
                          )}
                        </div>
                      </div>
                      {batch.notes && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{batch.notes}</p>
                      )}
                      {renderBatchActions(batch)}
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Batch & produk
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Hasil / target
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">
                          Total biaya
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">
                          HPP / unit
                        </th>
                        <th scope="col" className="px-5 py-3 text-right font-medium">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedBatches.map(batch => (
                        <tr key={batch.id} className="hover:bg-muted/20">
                          <td className="px-5 py-4">
                            <Link
                              to={`/production/batches/${batch.id}`}
                              state={{ returnTo }}
                              className="font-semibold hover:text-primary hover:underline"
                            >
                              {batch.productName}
                            </Link>
                            {batch.productionItems && batch.productionItems.length > 1 && (
                              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                                {batch.productionItems.map(item => (
                                  <li key={item.id}>
                                    {item.productName} · {item.targetQuantity} {item.productUnit}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-xs text-muted-foreground">
                                {batch.batchNumber}
                              </span>
                              {renderBatchSourceBadge(batch)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatBatchDate(batch.startedAt)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <ProductionStatusBadge status={batch.status} />
                          </td>
                          <td className="px-4 py-4 tabular-nums">
                            <p>
                              {isFinished(batch) ? `${batch.goodQuantity ?? 0} / ` : ''}
                              {batch.targetQuantity} {batch.productUnit}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {isFinished(batch)
                                ? `${batch.wasteQuantity ?? 0} afkir`
                                : 'Target produksi'}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">
                            {isFinished(batch) ? (
                              <CurrencyText value={batch.totalCost ?? 0} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-medium tabular-nums">
                            {isFinished(batch) ? (
                              <>
                                {batch.productionItems && batch.productionItems.length > 1 ? (
                                  <span className="text-xs text-muted-foreground">
                                    Lihat per varian
                                  </span>
                                ) : batch.hppPerUnit ? (
                                  <CurrencyText value={batch.hppPerUnit} />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs font-normal text-muted-foreground">
                                Belum final
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">{renderBatchActions(batch)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 border-t p-4">
                  <p className="text-xs text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <TablePagination
                    total={filteredBatches.length}
                    displayedCount={paginatedBatches.length}
                    page={currentPage}
                    totalPages={totalPages}
                    onPrev={() => setPage(Math.max(1, currentPage - 1))}
                    onNext={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={loading}
                    label="batch"
                    prevLabel="Sebelumnya"
                    nextLabel="Berikutnya"
                  />
                </div>
              </>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {actions.dialogs}
      <FeatureGuidanceTour feature="production" />
    </div>
  );
}
