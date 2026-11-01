import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, CircleX, Loader2, Pencil, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyText } from '@/components/ui/currency-text';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductionStatusBadge } from '@/features/production/components/production-status';
import { ProductionLogDetails } from '@/features/production/components/production-log-details';
import { ProductionBatchTiming } from '@/features/production/components/production-batch-timing';
import { ProductionBatchEditor } from '@/features/production/components/production-batch-editor';
import { useProductionBatchDetail } from '@/features/production/hooks/use-production-batch-detail';
import { PRODUCTION_STATUSES } from '@/features/production/types/production-status';
import { cn } from '@/lib/utils';

const cancelActionClassName =
  'min-h-11 cursor-pointer data-[variant=destructive]:text-red-700 data-[variant=destructive]:focus:bg-red-50 data-[variant=destructive]:focus:text-red-800 dark:data-[variant=destructive]:text-red-300 dark:data-[variant=destructive]:focus:bg-red-950 dark:data-[variant=destructive]:focus:text-red-200';

export default function BatchDetailPage() {
  const {
    query,
    head,
    returnTo,
    editing,
    setEditing,
    error,
    busy,
    updated,
    reopen,
    actions,
    canWrite,
    activeIndex,
    activeLog,
    activeBatch,
    selectLog,
    summary,
    running,
    queued,
    pending,
  } = useProductionBatchDetail();

  if (query.isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-muted-foreground"
      >
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />
        Memuat detail produksi…
      </div>
    );
  }
  if (query.isError || !head) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-12">
        <FeedbackAlert variant="error">Detail batch belum berhasil dimuat.</FeedbackAlert>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Coba lagi
        </Button>
        <Button asChild variant="outline">
          <Link to={returnTo}>Kembali ke Daftar Batch</Link>
        </Button>
      </div>
    );
  }
  if (editing && canWrite && head.status === 'DRAFT') {
    return <ProductionBatchEditor batch={head} onSaved={updated} />;
  }
  const multiple = head.logs.length > 1;
  const canBegin = head.status === 'QUEUED' || (head.status === 'IN_PROGRESS' && queued.length > 0);
  const canReopen = head.source === 'MANUAL' && head.status === 'QUEUED' && !head.started_at;
  const orderContext = [
    head.order_context_snapshot?.invoice_number
      ? `#${head.order_context_snapshot.invoice_number}`
      : '',
    head.order_context_snapshot?.table_number
      ? `Meja ${head.order_context_snapshot.table_number}`
      : '',
  ].filter(Boolean);

  return (
    <div className="min-w-0 space-y-6 pb-12 sm:space-y-8">
      <header aria-label="Informasi batch" className="space-y-4">
        <Link
          to={returnTo}
          className="inline-flex min-h-11 items-center gap-2 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Daftar Batch
        </Link>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div className="min-w-0 space-y-2">
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {head.batch_number}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <ProductionStatusBadge status={head.status} />
              <span>
                {head.source === 'MANUAL' ? 'Manual' : head.source === 'ONLINE' ? 'Online' : 'POS'}
              </span>
              <span>{head.logs.length} varian</span>
              {orderContext.length > 0 && (
                <span className="break-all">{orderContext.join(' · ')}</span>
              )}
            </div>
          </div>
          {canWrite && (
            <div className="flex flex-wrap items-center gap-2">
              {head.status === 'DRAFT' ? (
                <Button disabled={busy || actions.busy} onClick={() => setEditing(true)}>
                  Edit draft
                </Button>
              ) : running.length > 0 ? (
                <Button disabled={busy || actions.busy} onClick={() => actions.complete(head)}>
                  <Check aria-hidden="true" className="mr-2 h-4 w-4" />
                  {running.length > 1 ? 'Selesaikan semua varian' : 'Selesaikan produksi'}
                </Button>
              ) : (
                canBegin && (
                  <Button disabled={busy || actions.busy} onClick={() => actions.begin(head)}>
                    Mulai proses
                  </Button>
                )
              )}
              {(pending || canReopen) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={busy || actions.busy}>
                      Action <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    {canBegin && running.length > 0 && (
                      <DropdownMenuItem
                        className="min-h-11 cursor-pointer text-blue-700 focus:bg-blue-50 focus:text-blue-800 dark:text-blue-300 dark:focus:bg-blue-950 dark:focus:text-blue-200"
                        onSelect={() => actions.begin(head)}
                      >
                        <Play aria-hidden="true" className="size-4" />
                        Mulai varian antre
                      </DropdownMenuItem>
                    )}
                    {canReopen && (
                      <DropdownMenuItem
                        className="min-h-11 cursor-pointer"
                        onSelect={() => void reopen()}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Edit produksi
                      </DropdownMenuItem>
                    )}
                    {pending && (
                      <DropdownMenuItem
                        variant="destructive"
                        className={cancelActionClassName}
                        onSelect={() => actions.cancel(head)}
                      >
                        <CircleX aria-hidden="true" className="size-4" />
                        Batalkan batch
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
        <ProductionBatchTiming
          head={head}
          timezone={actions.timezone}
          settings={actions.settings}
        />
        {head.notes && (
          <p className="break-words border-l-2 border-border pl-3 text-sm leading-relaxed">
            <span className="font-medium">Catatan dapur: </span>
            {head.notes}
          </p>
        )}
      </header>
      {error && <FeedbackAlert variant="error">{error}</FeedbackAlert>}
      <div
        className={cn(
          'min-w-0 items-start',
          head.logs.length > 0 && 'grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]',
        )}
      >
        {head.logs.length > 0 && (
          <aside className="contents lg:block lg:min-w-0 lg:space-y-5">
            <div className="min-w-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card">
              <div className="rounded-xl border border-border bg-card p-3 lg:hidden">
                <label htmlFor="batch-variant" className="mb-2 block text-sm font-medium">
                  Pilih varian
                </label>
                <select
                  id="batch-variant"
                  value={activeLog?.id ?? ''}
                  onChange={e => selectLog(e.target.value)}
                  className="h-11 w-full min-w-0 cursor-pointer rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {head.logs.map(log => (
                    <option key={log.id} value={log.id}>
                      {log.recipe_snapshot.product_name} - {log.recipe_snapshot.variant_name} ·{' '}
                      {PRODUCTION_STATUSES[log.status].label}
                    </option>
                  ))}
                </select>
              </div>
              <nav aria-label="Varian produksi" className="hidden divide-y divide-border lg:block">
                {head.logs.map(log => (
                  <button
                    key={log.id}
                    type="button"
                    aria-current={log.id === activeLog?.id ? 'true' : undefined}
                    aria-controls="batch-variant-detail"
                    onClick={() => selectLog(log.id)}
                    className={cn(
                      'group/batch-variant block w-full cursor-pointer space-y-1 px-3 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current',
                      log.id === activeLog?.id &&
                        'bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                    )}
                  >
                    <span className="block break-words font-medium">
                      {log.recipe_snapshot.product_name}
                    </span>
                    <span className="block break-words font-normal group-aria-[current=true]/batch-variant:text-primary-foreground">
                      {log.recipe_snapshot.variant_name}
                    </span>
                    <span className="block text-[10px] font-normal leading-4 group-aria-[current=true]/batch-variant:text-primary-foreground">
                      {PRODUCTION_STATUSES[log.status].label} ·{' '}
                      {Number(
                        log.status === 'COMPLETED' ? log.good_quantity : log.target_quantity,
                      ).toLocaleString('id-ID')}{' '}
                      {log.recipe_snapshot.product_unit || 'pcs'}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
            {head.status === 'COMPLETED' && (
              <section
                aria-label="Biaya seluruh batch"
                className="order-last min-w-0 space-y-3 rounded-xl border border-border bg-card p-4 text-sm lg:order-none"
              >
                <h3 className="font-medium">Biaya seluruh batch</h3>
                <dl className="space-y-2 tabular-nums">
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-muted-foreground">Bahan</dt>
                    <dd>
                      <CurrencyText value={summary.material} />
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-muted-foreground">Biaya lain</dt>
                    <dd>
                      <CurrencyText value={summary.overhead} />
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 border-t border-border pt-2 font-semibold">
                    <dt>Total</dt>
                    <dd>
                      <CurrencyText value={summary.total} />
                    </dd>
                  </div>
                </dl>
              </section>
            )}
          </aside>
        )}
        {activeLog && activeBatch ? (
          <Card className="min-w-0 gap-0 border border-border p-4 shadow-none ring-0 sm:p-5">
            <section
              id="batch-variant-detail"
              aria-label="Detail varian"
              className="min-w-0 space-y-4"
            >
              {head.sale_id &&
                activeLog.status === 'COMPLETED' &&
                Number(activeLog.unfulfilled_quantity || 0) > 0 && (
                  <FeedbackAlert variant="info">
                    Pesanan belum terpenuhi: kurang {Number(activeLog.unfulfilled_quantity)}{' '}
                    {activeLog.recipe_snapshot.product_unit}.
                  </FeedbackAlert>
                )}
              <ProductionLogDetails
                variantIndex={activeIndex}
                totalVariants={head.logs.length}
                timezone={actions.timezone}
                headerActions={
                  multiple &&
                  canWrite &&
                  ['DRAFT', 'QUEUED', 'IN_PROGRESS'].includes(activeLog.status) ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" disabled={actions.busy} aria-label="Action">
                            Action <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {activeLog.status === 'IN_PROGRESS' && (
                            <DropdownMenuItem
                              className="min-h-11 cursor-pointer text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-300 dark:focus:bg-emerald-950 dark:focus:text-emerald-200"
                              onSelect={() => actions.complete(head, [activeLog])}
                            >
                              <Check aria-hidden="true" className="size-4" />
                              Selesaikan varian
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            variant="destructive"
                            className={cancelActionClassName}
                            onSelect={() => actions.cancel(head, activeLog.id)}
                          >
                            <CircleX aria-hidden="true" className="size-4" />
                            Batalkan varian
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : undefined
                }
                batch={{
                  ...activeBatch,
                  batchNumber: head.batch_number,
                  notes: activeLog.notes || '',
                }}
              />
            </section>
          </Card>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">Belum ada varian pada batch ini.</p>
        )}
      </div>
      {actions.dialogs}
    </div>
  );
}
