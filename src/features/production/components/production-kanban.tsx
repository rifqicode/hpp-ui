import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { ProductionKanbanTicket } from './production-kanban-ticket';
import { Badge } from '@/components/ui/badge';
import type { ProductionBatch } from '../types';

export interface ProductionKanbanProps {
  batches: ProductionBatch[];
  onPickup: (batchId: string) => Promise<void> | void;
  onComplete: (batch: ProductionBatch) => void;
  onCompleteItem?: (batch: ProductionBatch, itemId: string) => void;
  canAct?: boolean;
  isPickingUp?: string | null;
}

interface ColumnDef {
  id: 'DRAFT' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  title: string;
  subtitle: string;
  dotColor: string;
  badgeBg: string;
  filter: (b: ProductionBatch) => boolean;
}

export function ProductionKanban({
  batches,
  onPickup,
  onComplete,
  onCompleteItem,
  isPickingUp,
  canAct = true,
}: ProductionKanbanProps) {
  const navigate = useNavigate();
  const [now, setNow] = React.useState(Date.now);
  const [draggedBatchId, setDraggedBatchId] = React.useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = React.useState<ColumnDef['id'] | null>(null);
  const justDraggedRef = React.useRef(false);
  const dragFollowerRef = React.useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = React.useRef<{
    x: number;
    y: number;
    width: number;
    startX: number;
    startY: number;
  }>({
    x: 24,
    y: 24,
    width: 280,
    startX: 0,
    startY: 0,
  });
  const emptyDragImgRef = React.useRef<HTMLSpanElement | null>(null);

  const draggedBatch = React.useMemo(
    () => (draggedBatchId ? (batches.find(b => b.id === draggedBatchId) ?? null) : null),
    [batches, draggedBatchId],
  );

  // Position floating card follower at 60fps via compositor transform without React re-renders
  React.useEffect(() => {
    if (!draggedBatchId) return;
    if (dragFollowerRef.current) {
      dragFollowerRef.current.style.width = `${dragOffsetRef.current.width || 280}px`;
    }
    if (
      dragFollowerRef.current &&
      (dragOffsetRef.current.startX !== 0 || dragOffsetRef.current.startY !== 0)
    ) {
      const x = dragOffsetRef.current.startX - dragOffsetRef.current.x;
      const y = dragOffsetRef.current.startY - dragOffsetRef.current.y;
      dragFollowerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(1.5deg)`;
      dragFollowerRef.current.style.opacity = '1';
    }
    const handleWindowDragOver = (ev: DragEvent) => {
      if (!dragFollowerRef.current) return;
      if (ev.clientX === 0 && ev.clientY === 0) return;
      const x = ev.clientX - dragOffsetRef.current.x;
      const y = ev.clientY - dragOffsetRef.current.y;
      dragFollowerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(1.5deg)`;
      dragFollowerRef.current.style.opacity = '1';
    };
    window.addEventListener('dragover', handleWindowDragOver, { passive: true });
    return () => window.removeEventListener('dragover', handleWindowDragOver);
  }, [draggedBatchId]);
  const hasActiveBatches = React.useMemo(
    () => batches.some(b => b.status === 'QUEUED' || b.status === 'IN_PROGRESS'),
    [batches],
  );

  // Auto-refresh relative time & late status every 30 seconds only when active batches exist and tab is visible
  React.useEffect(() => {
    if (!hasActiveBatches) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') setNow(Date.now());
    }, 30_000);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [hasActiveBatches]);

  const columns: ColumnDef[] = [
    {
      id: 'QUEUED',
      title: 'Antrian',
      subtitle: 'Menunggu Diproses',
      dotColor: 'bg-amber-500',
      badgeBg:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      filter: b => b.status === 'QUEUED',
    },
    {
      id: 'IN_PROGRESS',
      title: 'Sedang Diproduksi',
      subtitle: 'Dalam Proses Produksi',
      dotColor: 'bg-blue-500',
      badgeBg:
        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      filter: b => b.status === 'IN_PROGRESS',
    },
    {
      id: 'COMPLETED',
      title: 'Selesai',
      subtitle: 'Siap Disajikan / Stok Jadi',
      dotColor: 'bg-emerald-500',
      badgeBg:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      filter: b => b.status === 'COMPLETED',
    },
  ];

  if (batches.some(batch => batch.status === 'DRAFT'))
    columns.unshift({
      id: 'DRAFT',
      title: 'Draft',
      subtitle: 'Belum Masuk Antrian',
      dotColor: 'bg-zinc-400',
      badgeBg: 'bg-muted text-muted-foreground border-border',
      filter: batch => batch.status === 'DRAFT',
    });

  const hasCancelled = batches.some(b => b.status === 'CANCELLED' || b.status === 'VOID');
  if (hasCancelled) {
    columns.push({
      id: 'CANCELLED',
      title: 'Batal / Void',
      subtitle: 'Produksi Dibatalkan',
      dotColor: 'bg-zinc-500',
      badgeBg: 'bg-muted text-muted-foreground border-border',
      filter: b => b.status === 'CANCELLED' || b.status === 'VOID',
    });
  }

  const gridColsClass =
    columns.length === 4
      ? 'grid min-w-0 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start'
      : 'grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start';

  return (
    <div className={gridColsClass} aria-label="Papan Kanban Dapur Produksi">
      <span
        ref={emptyDragImgRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-96 -top-96 h-px w-px opacity-0"
      />
      {draggedBatch && (
        <div
          ref={dragFollowerRef}
          aria-hidden="true"
          style={{
            opacity: 0,
          }}
          className="pointer-events-none fixed left-0 top-0 z-50 rounded-lg border-2 border-primary bg-card p-3 shadow-2xl ring-4 ring-primary/15 will-change-transform"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-mono text-xs font-semibold text-primary">
              {draggedBatch.batchNumber}
            </span>
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {draggedBatch.source === 'POS'
                ? 'POS'
                : draggedBatch.source === 'ONLINE'
                  ? 'Online'
                  : 'Manual'}
            </Badge>
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-foreground">
            {draggedBatch.productName}
          </p>
          <p className="mt-1 text-[11px] font-medium text-primary">
            {draggedBatch.status === 'QUEUED'
              ? 'Geser ke Sedang Diproduksi →'
              : 'Geser ke Selesai →'}
          </p>
        </div>
      )}
      {columns.map(col => {
        const colBatches = batches.filter(col.filter);
        const isValidDropTarget = Boolean(
          canAct &&
          draggedBatch &&
          ((draggedBatch.status === 'QUEUED' && col.id === 'IN_PROGRESS') ||
            (draggedBatch.status === 'IN_PROGRESS' && col.id === 'COMPLETED')),
        );
        const isOverValidTarget = isValidDropTarget && dragOverColId === col.id;

        return (
          <div
            key={col.id}
            data-column-id={col.id}
            onDragOver={e => {
              if (!isValidDropTarget) return;
              e.preventDefault();
              if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
              if (dragOverColId !== col.id) setDragOverColId(col.id);
            }}
            onDragLeave={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                if (dragOverColId === col.id) setDragOverColId(null);
              }
            }}
            onDrop={e => {
              e.preventDefault();
              const targetBatch = draggedBatch;
              setDraggedBatchId(null);
              setDragOverColId(null);
              if (!targetBatch || !isValidDropTarget) return;
              if (targetBatch.status === 'QUEUED' && col.id === 'IN_PROGRESS') {
                void onPickup(targetBatch.id);
              } else if (targetBatch.status === 'IN_PROGRESS' && col.id === 'COMPLETED') {
                onComplete(targetBatch);
              }
            }}
            className={`flex min-w-0 flex-col rounded-xl border bg-card/60 shadow-2xs transition-all ${
              isOverValidTarget
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : isValidDropTarget
                  ? 'border-dashed border-primary/50'
                  : 'border-border'
            }`}
          >
            {/* Header Kolom */}
            <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-none">{col.subtitle}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${col.badgeBg}`}
              >
                {colBatches.length}
              </Badge>
            </div>

            {/* List Kartu Kolom */}
            <div className="p-2.5 flex flex-col gap-2.5 min-h-24 md:min-h-[380px] md:max-h-[720px] md:overflow-y-auto">
              {isValidDropTarget && draggedBatch && (
                <div
                  className={`rounded-lg border-2 border-dashed p-3 transition-all ${
                    isOverValidTarget
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : 'border-primary/40 bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-primary">
                      {draggedBatch.batchNumber}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {draggedBatch.targetQuantity} {draggedBatch.productUnit}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground">
                    {draggedBatch.productName}
                  </p>
                  <p
                    className={`mt-1.5 text-center text-xs font-semibold ${
                      isOverValidTarget ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {col.id === 'IN_PROGRESS'
                      ? 'Lepas di sini untuk mulai produksi'
                      : 'Lepas di sini untuk isi hasil & selesaikan'}
                  </p>
                </div>
              )}
              {colBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-24 md:min-h-48 text-center p-4 border border-dashed border-border/80 rounded-lg bg-background/50">
                  <Package className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Tidak ada batch {col.title.toLowerCase()}
                  </p>
                </div>
              ) : (
                colBatches.map(b => {
                  const items =
                    b.productionItems && b.productionItems.length > 0 ? b.productionItems : [b];
                  const isCurrentPickingUp = Boolean(isPickingUp);
                  const deadline = b.targetCompletedAt ? Date.parse(b.targetCompletedAt) : null;
                  const alertEnabled = b.timerAlert ? b.timerAlert.enabled : Boolean(deadline);
                  const isActiveStatus = b.status === 'QUEUED' || b.status === 'IN_PROGRESS';
                  const late = Boolean(
                    alertEnabled && deadline !== null && now > deadline && isActiveStatus,
                  );
                  const warningLeadMs = (b.timerAlert?.warningLeadMinutes ?? 3) * 60_000;
                  const warning = Boolean(
                    !late &&
                    alertEnabled &&
                    deadline !== null &&
                    now >= deadline - warningLeadMs &&
                    isActiveStatus,
                  );

                  const canDrag =
                    canAct &&
                    !isCurrentPickingUp &&
                    (b.status === 'QUEUED' || b.status === 'IN_PROGRESS');
                  const isBeingDragged = draggedBatchId === b.id;

                  return (
                    <div
                      key={b.id}
                      data-batch-id={b.id}
                      draggable={canDrag}
                      onDragStart={e => {
                        if (!canDrag) {
                          e.preventDefault();
                          return;
                        }
                        justDraggedRef.current = true;
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (e.clientX || e.clientY) {
                          dragOffsetRef.current = {
                            x: Math.max(12, Math.min(rect.width - 12, e.clientX - rect.left)),
                            y: Math.max(12, Math.min(rect.height - 12, e.clientY - rect.top)),
                            width: rect.width || 280,
                            startX: e.clientX,
                            startY: e.clientY,
                          };
                          if (emptyDragImgRef.current && e.dataTransfer?.setDragImage) {
                            e.dataTransfer.setDragImage(emptyDragImgRef.current, 0, 0);
                          }
                        } else {
                          dragOffsetRef.current = {
                            x: 24,
                            y: 24,
                            width: rect.width || 280,
                            startX: 0,
                            startY: 0,
                          };
                        }
                        setDraggedBatchId(b.id);
                        if (e.dataTransfer) {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', b.id);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedBatchId(null);
                        setDragOverColId(null);
                        setTimeout(() => {
                          justDraggedRef.current = false;
                        }, 0);
                      }}
                      onClick={e => {
                        if (justDraggedRef.current) return;
                        if ((e.target as HTMLElement).closest('button, a')) return;
                        navigate(`/production/batches/${b.id}`);
                      }}
                      className={`group relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 ${
                        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${
                        isBeingDragged
                          ? 'opacity-40 border-dashed border-primary/50 scale-[0.98]'
                          : ''
                      } ${
                        late
                          ? 'border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/20'
                          : warning
                            ? 'border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20'
                            : 'border-border'
                      }`}
                    >
                      <ProductionKanbanTicket
                        batch={b}
                        items={items}
                        canAct={canAct}
                        busy={isCurrentPickingUp}
                        late={late}
                        warning={warning}
                        deadline={deadline}
                        now={now}
                        onPickup={onPickup}
                        onComplete={onComplete}
                        onCompleteItem={onCompleteItem}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
