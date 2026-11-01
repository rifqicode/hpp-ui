import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Truck,
  CreditCard,
  Calendar,
  Building2,
  AlertCircle,
  Package,
  Check,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyText } from '@/components/ui/currency-text';
import { POCategoryBadge } from './po-category-badge';
import type { PurchaseOrder } from '../types';
import type { PurchaseOrderKanbanState } from '../hooks/use-purchase-order-kanban-query';

interface PurchaseOrderKanbanProps {
  orders: PurchaseOrder[];
  columns?: PurchaseOrderKanbanState[];
  canProcess: boolean;
  onApprove?: (po: PurchaseOrder) => void;
  onCreateInvoice?: (po: PurchaseOrder) => void;
  onReceive?: (po: PurchaseOrder) => void;
  onPay?: (po: PurchaseOrder) => void;
}

interface ColumnDef {
  id: 'pengajuan' | 'dipesan' | 'invoice' | 'diterima' | 'selesai' | 'ditutup';
  title: string;
  subtitle: string;
  dotColor: string;
  badgeBg: string;
  filter: (po: PurchaseOrder) => boolean;
}

function getValidDropTarget(po: PurchaseOrder | null): ColumnDef['id'] | null {
  if (!po) return null;
  if (po.status === 'PURCHASE_REQUEST') return 'dipesan';
  if (po.status === 'PURCHASE_ORDER') return 'invoice';
  if (po.status === 'PURCHASE_INVOICE' && po.receiptStatus !== 'RECEIVED') return 'diterima';
  if (
    po.status === 'PURCHASE_INVOICE' &&
    po.receiptStatus === 'RECEIVED' &&
    po.paymentStatus !== 'PAID'
  ) {
    return 'selesai';
  }
  return null;
}

function canDragPO(po: PurchaseOrder, canProcess: boolean): boolean {
  if (!canProcess) return false;
  return getValidDropTarget(po) !== null;
}

function getPOAlert(po: PurchaseOrder, now: number) {
  // 1. Required Date Alert (for PR & PO waiting delivery)
  const isWaitingDelivery =
    po.status === 'PURCHASE_REQUEST' ||
    po.status === 'PURCHASE_ORDER' ||
    (po.status === 'PURCHASE_INVOICE' && po.receiptStatus !== 'RECEIVED');

  let requiredLate = false;
  let requiredWarning = false;
  let requiredLateDiffDays = 0;
  let requiredWarningDiffDays = 0;

  if (isWaitingDelivery && po.requiredDate) {
    const reqMs = new Date(po.requiredDate).getTime();
    if (reqMs < now) {
      requiredLate = true;
      requiredLateDiffDays = Math.max(1, Math.floor((now - reqMs) / 86400_000));
    } else if (reqMs - now <= 48 * 3600_000) {
      requiredWarning = true;
      requiredWarningDiffDays = Math.max(0, Math.ceil((reqMs - now) / 86400_000));
    }
  }

  // 2. Payment Due Date Alert (for Goods Received waiting payment)
  const isWaitingPayment =
    (po.status === 'PURCHASE_INVOICE' || po.status === 'PURCHASE_ORDER') &&
    po.receiptStatus === 'RECEIVED' &&
    po.paymentStatus !== 'PAID';

  let paymentLate = false;
  let paymentWarning = false;
  let paymentLateDiffDays = 0;
  let paymentWarningDiffDays = 0;

  if (isWaitingPayment && po.paymentDueDate) {
    const dueMs = new Date(po.paymentDueDate).getTime();
    if (dueMs < now) {
      paymentLate = true;
      paymentLateDiffDays = Math.max(1, Math.floor((now - dueMs) / 86400_000));
    } else if (dueMs - now <= 72 * 3600_000) {
      paymentWarning = true;
      paymentWarningDiffDays = Math.max(1, Math.ceil((dueMs - now) / 86400_000));
    }
  }

  const late = requiredLate || paymentLate;
  const warning = !late && (requiredWarning || paymentWarning);

  return {
    late,
    warning,
    requiredLate,
    requiredWarning,
    requiredLateDiffDays,
    requiredWarningDiffDays,
    paymentLate,
    paymentWarning,
    paymentLateDiffDays,
    paymentWarningDiffDays,
  };
}

export function PurchaseOrderKanban({
  orders,
  columns: columnStates,
  canProcess,
  onApprove,
  onCreateInvoice,
  onReceive,
  onPay,
}: PurchaseOrderKanbanProps) {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const [draggedPOId, setDraggedPOId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<ColumnDef['id'] | null>(null);
  const justDraggedRef = useRef(false);
  const dragFollowerRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{
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
  const emptyDragImgRef = useRef<HTMLSpanElement | null>(null);

  // Position floating card follower at 60fps via compositor transform without React re-renders
  useEffect(() => {
    if (!draggedPOId) return;
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
  }, [draggedPOId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const allOrders = useMemo(() => {
    if (!columnStates) return orders;
    const map = new Map<string, PurchaseOrder>();
    orders.forEach(o => map.set(o.id, o));
    columnStates.forEach(c => c.orders.forEach(o => map.set(o.id, o)));
    return Array.from(map.values());
  }, [orders, columnStates]);

  const draggedPO = useMemo(
    () => (draggedPOId ? (allOrders.find(o => o.id === draggedPOId) ?? null) : null),
    [allOrders, draggedPOId],
  );

  const validTargetForDragged = useMemo(() => getValidDropTarget(draggedPO), [draggedPO]);

  const columns: ColumnDef[] = [
    {
      id: 'pengajuan',
      title: 'Purchase Request',
      subtitle: 'Menunggu Persetujuan',
      dotColor: 'bg-blue-500',
      badgeBg:
        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      filter: po => po.status === 'PURCHASE_REQUEST',
    },
    {
      id: 'dipesan',
      title: 'Purchase Order',
      subtitle: 'Menunggu Invoice',
      dotColor: 'bg-amber-500',
      badgeBg:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      filter: po => po.status === 'PURCHASE_ORDER' && po.receiptStatus !== 'RECEIVED',
    },
    {
      id: 'invoice',
      title: 'Purchase Invoice',
      subtitle: 'Menunggu Pengiriman',
      dotColor: 'bg-purple-500',
      badgeBg:
        'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      filter: po => po.status === 'PURCHASE_INVOICE' && po.receiptStatus !== 'RECEIVED',
    },
    {
      id: 'diterima',
      title: 'Barang Diterima',
      subtitle: 'Menunggu Pembayaran',
      dotColor: 'bg-indigo-500',
      badgeBg:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      filter: po =>
        (po.status === 'PURCHASE_INVOICE' || po.status === 'PURCHASE_ORDER') &&
        po.receiptStatus === 'RECEIVED' &&
        po.paymentStatus !== 'PAID',
    },
    {
      id: 'selesai',
      title: 'Selesai',
      subtitle: 'Barang Masuk & Lunas',
      dotColor: 'bg-emerald-500',
      badgeBg:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      filter: po =>
        po.status === 'COMPLETED' ||
        ((po.status === 'PURCHASE_INVOICE' || po.status === 'PURCHASE_ORDER') &&
          po.receiptStatus === 'RECEIVED' &&
          po.paymentStatus === 'PAID'),
    },
    {
      id: 'ditutup',
      title: 'Ditolak / Dibatalkan',
      subtitle: 'Pengajuan ditutup',
      dotColor: 'bg-zinc-500',
      badgeBg: 'bg-muted text-muted-foreground border-border',
      filter: po => po.status === 'REJECTED' || po.status === 'CANCELLED',
    },
  ];

  function formatShortDate(dateStr?: string) {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  }

  return (
    <>
      <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {columns.map(col => {
          const state = columnStates?.find(column => column.id === col.id);
          const columnOrders = state ? state.orders.filter(col.filter) : orders.filter(col.filter);

          const isValidDropTarget = Boolean(draggedPO && validTargetForDragged === col.id);
          const isOverValidTarget = isValidDropTarget && dragOverColId === col.id;

          return (
            <div
              key={col.id}
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
                const targetPO = draggedPO;
                setDraggedPOId(null);
                setDragOverColId(null);
                if (!targetPO || !isValidDropTarget) return;

                if (targetPO.status === 'PURCHASE_REQUEST' && col.id === 'dipesan') {
                  onApprove?.(targetPO);
                } else if (targetPO.status === 'PURCHASE_ORDER' && col.id === 'invoice') {
                  onCreateInvoice?.(targetPO);
                } else if (
                  targetPO.status === 'PURCHASE_INVOICE' &&
                  targetPO.receiptStatus !== 'RECEIVED' &&
                  col.id === 'diterima'
                ) {
                  onReceive?.(targetPO);
                } else if (
                  (targetPO.status === 'PURCHASE_INVOICE' ||
                    targetPO.status === 'PURCHASE_ORDER') &&
                  targetPO.receiptStatus === 'RECEIVED' &&
                  targetPO.paymentStatus !== 'PAID' &&
                  col.id === 'selesai'
                ) {
                  onPay?.(targetPO);
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
              {/* Column Header */}
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
                  {state?.total ?? columnOrders.length}
                </Badge>
              </div>

              {/* Column Cards */}
              <div className="p-2.5 flex flex-col gap-2.5 min-h-24 md:min-h-[380px] md:max-h-[720px] md:overflow-y-auto">
                {isValidDropTarget && draggedPO && (
                  <div
                    className={`rounded-lg border-2 border-dashed p-3 transition-all ${
                      isOverValidTarget
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-primary/40 bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-primary">
                        {draggedPO.poNumber}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {draggedPO.items.length} item
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-foreground">
                      {draggedPO.supplierName || 'Tanpa supplier'}
                    </p>
                    <p
                      className={`mt-1.5 text-center text-xs font-semibold ${
                        isOverValidTarget ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {col.id === 'dipesan'
                        ? 'Lepas di sini untuk setujui (PO)'
                        : col.id === 'invoice'
                          ? 'Lepas di sini untuk terbitkan invoice'
                          : col.id === 'diterima'
                            ? 'Lepas di sini untuk terima barang'
                            : 'Lepas di sini untuk tandai lunas'}
                    </p>
                  </div>
                )}

                {columnOrders.length === 0 && !state?.error ? (
                  <div className="flex flex-col items-center justify-center min-h-24 md:min-h-48 text-center p-4 border border-dashed border-border/80 rounded-lg bg-background/50">
                    <Package className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                    <p className="text-xs font-medium text-muted-foreground">Tidak tersedia</p>
                  </div>
                ) : (
                  columnOrders.map(po => {
                    const alert = getPOAlert(po, now);
                    const canDrag = canDragPO(po, canProcess);
                    const isBeingDragged = draggedPOId === po.id;

                    return (
                      <div
                        key={po.id}
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
                          setDraggedPOId(po.id);
                          if (e.dataTransfer) {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', po.id);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedPOId(null);
                          setDragOverColId(null);
                          setTimeout(() => {
                            justDraggedRef.current = false;
                          }, 0);
                        }}
                        onClick={e => {
                          if (justDraggedRef.current) return;
                          if ((e.target as HTMLElement).closest('button, a')) return;
                          navigate(`/inventory/purchase-orders/${po.id}`);
                        }}
                        className={`group relative rounded-lg border bg-card p-3.5 shadow-2xs transition-all space-y-2.5 ${
                          canDrag
                            ? 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-xs'
                            : 'cursor-pointer hover:border-primary/50'
                        } ${
                          isBeingDragged ? 'opacity-40 border-dashed border-primary/50 scale-[0.98]' : ''
                        } ${
                          alert.late
                            ? 'kds-card-late'
                            : alert.warning
                              ? 'kds-card-warning'
                              : 'border-border'
                        }`}
                      >
                        {/* Top Row: PO Number & Category */}
                        <div className="flex items-center justify-between gap-1.5">
                          <Link
                            to={`/inventory/purchase-orders/${po.id}`}
                            draggable={false}
                            className="min-w-0 break-words text-xs font-bold text-primary hover:underline focus-visible:underline flex items-center gap-1"
                          >
                            {po.poNumber}
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <POCategoryBadge category={po.category} short />
                        </div>

                        {/* Supplier */}
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {po.supplierName || (
                              <span className="text-muted-foreground italic font-normal">
                                Belum ditentukan
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Pesan:
                            </span>
                            <span>{formatShortDate(po.orderDate)}</span>
                          </div>

                          {po.requiredDate && (
                            <div
                              className={`flex items-center justify-between font-medium ${
                                alert.requiredLate
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                  : alert.requiredWarning
                                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                {alert.requiredLate ? (
                                  <AlertCircle className="h-3 w-3 text-rose-500" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                Dibutuhkan:
                              </span>
                              <span>{formatShortDate(po.requiredDate)}</span>
                            </div>
                          )}

                          {po.paymentDueDate && (
                            <div
                              className={`flex items-center justify-between font-medium ${
                                alert.paymentLate
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                  : alert.paymentWarning
                                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                {alert.paymentLate ? (
                                  <AlertCircle className="h-3 w-3 text-rose-500" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                Jatuh Tempo:
                              </span>
                              <span>{formatShortDate(po.paymentDueDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Amount & Items & Alert Indicator */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                          {alert.late ? (
                            <span className="animate-late-blink inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                              <span className="relative flex h-2 w-2" aria-hidden="true">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:animate-none" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
                              </span>
                              {alert.requiredLate
                                ? `Telat ${alert.requiredLateDiffDays} hr`
                                : `Tempo lewat ${alert.paymentLateDiffDays} hr`}
                            </span>
                          ) : alert.warning ? (
                            <span className="animate-late-blink inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <span className="relative flex h-2 w-2" aria-hidden="true">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75 motion-reduce:animate-none" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                              </span>
                              {alert.requiredWarning
                                ? alert.requiredWarningDiffDays <= 0
                                  ? 'Dibutuhkan Hari Ini'
                                  : `Dibutuhkan ${alert.requiredWarningDiffDays} hr lagi`
                                : `Tempo ${alert.paymentWarningDiffDays} hr lagi`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {po.items.length} item
                            </span>
                          )}

                          <span className="font-mono font-bold text-foreground">
                            {po.status === 'PURCHASE_REQUEST' || po.totalAmount === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic font-normal">
                                Menunggu harga
                              </span>
                            ) : (
                              <CurrencyText value={po.totalAmount} />
                            )}
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        {canProcess &&
                          ((col.id === 'pengajuan' && onApprove) ||
                            (col.id === 'dipesan' && onCreateInvoice) ||
                            (col.id === 'invoice' && onReceive) ||
                            (col.id === 'diterima' && onPay)) && (
                            <div className="pt-1.5 border-t border-border/60">
                              {col.id === 'pengajuan' && onApprove && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onApprove(po);
                                  }}
                                  className="w-full h-8 text-xs font-semibold gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Setujui (PO)
                                </Button>
                              )}

                              {col.id === 'dipesan' && onCreateInvoice && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onCreateInvoice(po);
                                  }}
                                  className="w-full h-8 text-xs font-semibold gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-purple-200 dark:border-purple-800"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  Set Harga & Invoice
                                </Button>
                              )}

                              {col.id === 'invoice' && onReceive && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onReceive(po);
                                  }}
                                  className="w-full h-8 text-xs font-semibold gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  Terima Barang
                                </Button>
                              )}

                              {col.id === 'diterima' && onPay && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onPay(po);
                                  }}
                                  className="w-full h-8 text-xs font-semibold gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Tandai Lunas
                                </Button>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
                {state?.error && (
                  <div
                    role="alert"
                    className="space-y-2 rounded-lg border border-destructive/30 p-3 text-xs"
                  >
                    <p>{state.error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={state.isFetching}
                      onClick={() => void state.retry()}
                    >
                      Coba lagi {col.title}
                    </Button>
                  </div>
                )}
                {state?.hasMore && !state.error && (
                  <Button
                    variant="outline"
                    className="w-full shrink-0 text-xs"
                    aria-label={`Muat lebih banyak ${col.title}`}
                    disabled={state.isFetching}
                    onClick={() => void state.loadMore()}
                  >
                    {state.loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Drag Follower Preview */}
      {draggedPO && (
        <div
          ref={dragFollowerRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-50 rounded-xl border-2 border-primary bg-card/95 p-3.5 shadow-2xl backdrop-blur-xs opacity-0 will-change-transform"
          style={{ width: `${dragOffsetRef.current.width}px` }}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-mono text-xs font-bold text-primary">{draggedPO.poNumber}</span>
            <POCategoryBadge category={draggedPO.category} short />
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-foreground">
            {draggedPO.supplierName || 'Tanpa supplier'}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{draggedPO.items.length} item</span>
            <span className="font-mono font-bold">
              {draggedPO.totalAmount > 0 ? (
                <CurrencyText value={draggedPO.totalAmount} />
              ) : (
                'Menunggu harga'
              )}
            </span>
          </div>
        </div>
      )}
      <span ref={emptyDragImgRef} className="fixed -top-96 -left-96 h-0 w-0 opacity-0" />
    </>
  );
}
