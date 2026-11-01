import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductionBatch } from '../types';

function elapsed(date: string | undefined, now: number) {
  if (!date) return '';
  const minutes = Math.floor((now - Date.parse(date)) / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} jam lalu`;
  return `${Math.floor(minutes / 1440)} hari lalu`;
}

function groupVisibleItems(items: ProductionBatch[]) {
  const groups = new Map<string, { name: string; items: ProductionBatch[] }>();
  for (const item of items.slice(0, 3)) {
    const name = item.recipeSnapshot?.product_name || item.productName;
    const key = `${item.productId}:${name}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { name, items: [item] });
  }
  return [...groups.entries()];
}

export function ProductionKanbanTicket({
  batch,
  items,
  canAct,
  busy,
  late,
  warning,
  deadline,
  now,
  onPickup,
  onComplete,
  onCompleteItem,
}: {
  batch: ProductionBatch;
  items: ProductionBatch[];
  canAct: boolean;
  busy: boolean;
  late: boolean;
  warning: boolean;
  deadline: number | null;
  now: number;
  onPickup: (id: string) => void | Promise<void>;
  onComplete: (batch: ProductionBatch) => void;
  onCompleteItem?: (batch: ProductionBatch, itemId: string) => void;
}) {
  const source = batch.source || (batch.saleId ? 'POS' : 'MANUAL');
  const context = batch.orderContext?.table_number
    ? `Meja ${batch.orderContext.table_number}`
    : source !== 'POS' && batch.orderContext?.invoice_number
      ? `#${batch.orderContext.invoice_number}`
      : '';
  const included = items.filter(item => !['CANCELLED', 'VOID'].includes(item.status));
  const completedCount = included.filter(item => item.status === 'COMPLETED').length;
  const completed = batch.status === 'COMPLETED';
  const queued = batch.status === 'QUEUED' || batch.status === 'DRAFT';

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
        <div className="min-w-0 space-y-1">
          <Link
            to={`/production/batches/${batch.id}`}
            draggable={false}
            className="block break-all rounded font-medium underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {batch.batchNumber}
          </Link>
          <p className="break-words">
            {source === 'MANUAL' ? 'Manual' : source === 'ONLINE' ? 'Online' : 'POS'}
            {context && ` · ${context}`}
          </p>
        </div>
        {!completed && <span className="shrink-0">{elapsed(batch.startedAt, now)}</span>}
      </div>

      <div className="mt-4 space-y-4">
        {groupVisibleItems(items).map(([key, group]) => (
          <section key={key} aria-label={group.name} className="space-y-2">
            <h4 className="break-words text-sm font-semibold leading-5 text-foreground">
              {group.name}
            </h4>
            <ul className="space-y-2">
              {group.items.map(item => {
                const done = item.status === 'COMPLETED';
                const cancelled = item.status === 'CANCELLED' || item.status === 'VOID';
                const variant = item.recipeSnapshot?.variant_name;
                return (
                  <li key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-1">
                        {onCompleteItem && (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={done}
                            aria-label={`Selesaikan ${group.name} - ${variant && variant !== 'Default' ? variant : 'Standar'}`}
                            disabled={
                              !canAct ||
                              busy ||
                              batch.status !== 'IN_PROGRESS' ||
                              item.status !== 'IN_PROGRESS'
                            }
                            onClick={event => {
                              event.stopPropagation();
                              if (
                                canAct &&
                                !busy &&
                                batch.status === 'IN_PROGRESS' &&
                                item.status === 'IN_PROGRESS'
                              )
                                onCompleteItem(batch, item.id);
                            }}
                            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent sm:size-8"
                          >
                            <span
                              aria-hidden="true"
                              className={`inline-flex size-4 items-center justify-center rounded-[3px] border ${done ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950' : 'border-slate-500 bg-background dark:border-slate-400'}`}
                            >
                              {done && <Check className="size-3" />}
                            </span>
                          </button>
                        )}
                        <Link
                          to={`/production/batches/${batch.id}?variant=${item.id}`}
                          draggable={false}
                          className="flex min-w-0 items-start gap-1.5 rounded leading-5 text-slate-600 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-300"
                        >
                          {done && !onCompleteItem && (
                            <Check
                              aria-hidden="true"
                              className="mt-0.5 size-3.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                            />
                          )}
                          <span className="break-words">
                            {variant && variant !== 'Default' ? variant : 'Jumlah produksi'}
                            {cancelled && ' · Dibatalkan'}
                          </span>
                        </Link>
                      </div>
                      <div className="max-w-[50%] shrink-0 text-right tabular-nums">
                        <p className="break-words font-medium leading-5 text-foreground">
                          {done
                            ? `${Number(item.goodQuantity ?? 0).toLocaleString('id-ID')}/${item.targetQuantity.toLocaleString('id-ID')}`
                            : item.targetQuantity.toLocaleString('id-ID')}{' '}
                          <span className="font-normal text-slate-600 dark:text-slate-300">
                            {item.productUnit}
                          </span>
                        </p>
                        {done && Number(item.wasteQuantity) > 0 && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {Number(item.wasteQuantity).toLocaleString('id-ID')} afkir
                          </p>
                        )}
                      </div>
                    </div>
                    {!!item.recipeSnapshot?.modifiers?.length && (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {item.recipeSnapshot.modifiers.map((modifier, index) => (
                          <span key={modifier.id || index}>+ {modifier.name}</span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {items.length > 3 && (
          <Link
            to={`/production/batches/${batch.id}`}
            draggable={false}
            className="inline-block rounded text-xs text-slate-600 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-300"
          >
            +{items.length - 3} varian lainnya
          </Link>
        )}
      </div>

      {batch.notes && (
        <p
          className="mt-4 line-clamp-2 break-words text-sm leading-5 text-foreground"
          title={batch.notes}
        >
          <span className="font-medium">Catatan: </span>
          {batch.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            {completed
              ? `${completedCount} varian selesai`
              : batch.status === 'IN_PROGRESS'
                ? `${completedCount}/${included.length} varian selesai`
                : `${items.length} varian`}
          </p>
          {completed && batch.completedAt && (
            <p>
              Selesai{' '}
              {new Date(batch.completedAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
          {late && deadline !== null ? (
            <p className="animate-late-blink inline-flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-300">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
              Terlambat {Math.max(1, Math.floor((now - deadline) / 60_000))} menit
            </p>
          ) : warning && deadline !== null ? (
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Sisa {Math.max(1, Math.ceil((deadline - now) / 60_000))} menit
            </p>
          ) : null}
        </div>
        {canAct && queued && (
          <Button
            size="sm"
            disabled={busy}
            onClick={event => {
              event.stopPropagation();
              void onPickup(batch.id);
            }}
            className="h-auto min-h-11 max-w-full gap-1.5 whitespace-normal px-3 py-2 text-xs sm:min-h-9"
          >
            {busy ? (
              <Loader2
                aria-hidden="true"
                className="size-3.5 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Play aria-hidden="true" className="size-3.5" />
            )}
            {batch.status === 'DRAFT' ? 'Edit draft' : 'Mulai produksi'}
          </Button>
        )}
        {canAct && batch.status === 'IN_PROGRESS' && (
          <Button
            size="sm"
            disabled={busy}
            onClick={event => {
              event.stopPropagation();
              onComplete(batch);
            }}
            className="h-auto min-h-11 max-w-full gap-1.5 whitespace-normal px-3 py-2 text-xs sm:min-h-9"
          >
            <CheckCircle2 aria-hidden="true" className="size-3.5" /> Selesaikan
          </Button>
        )}
      </div>
    </>
  );
}
