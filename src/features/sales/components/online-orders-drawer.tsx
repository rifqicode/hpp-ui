import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
  Utensils,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyText } from '@/components/ui/currency-text';
import { salesService } from '../services/sales-service';
import {
  buildBuyerCourierNotificationWhatsAppUrl,
  formatFulfillmentLabel,
} from '@/features/storefront/lib/whatsapp';
import type { PaymentMethod, Sale } from '../types';

interface OnlineOrdersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingOrders: Sale[];
  activeOrders: Sale[];
  isLoading: boolean;
  onRefresh: () => void;
  onOrderProcessed: (updatedSale: Sale) => void;
  storeName?: string;
  storeSlug?: string;
}

export function OnlineOrdersDrawer({
  open,
  onOpenChange,
  pendingOrders,
  activeOrders,
  isLoading,
  onRefresh,
  onOrderProcessed,
  storeName = 'Toko Kami',
  storeSlug = '',
}: OnlineOrdersDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'processing'>(
    'pending'
  );
  const [actionError, setActionError] = React.useState('');

  // Accept Modal State
  const [acceptingOrder, setAcceptingOrder] = React.useState<Sale | null>(null);
  const [acceptPaymentMethod, setAcceptPaymentMethod] =
    React.useState<PaymentMethod>('CASH');
  const [acceptCashReceived, setAcceptCashReceived] = React.useState('');
  const [acceptPaymentRef, setAcceptPaymentRef] = React.useState('');
  const [acceptDeliveryFee, setAcceptDeliveryFee] = React.useState('');
  const [isAccepting, setIsAccepting] = React.useState(false);

  // Fulfill / Courier Modal State
  const [fulfillingOrder, setFulfillingOrder] = React.useState<Sale | null>(
    null
  );
  const [courierName, setCourierName] = React.useState('');
  const [trackingInfo, setTrackingInfo] = React.useState('');
  const [fulfillDeliveryFee, setFulfillDeliveryFee] = React.useState('');
  const [isFulfilling, setIsFulfilling] = React.useState(false);

  // Reject Modal State
  const [rejectingOrder, setRejectingOrder] = React.useState<Sale | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);

  const openAcceptDialog = (order: Sale) => {
    setActionError('');
    setAcceptingOrder(order);
    setAcceptPaymentMethod(order.paymentMethod || 'CASH');
    setAcceptCashReceived(String(Math.round(order.totalAmount || 0)));
    setAcceptPaymentRef(order.paymentReference || '');
    setAcceptDeliveryFee(String(Math.round(order.deliveryFee || 0)));
  };

  const openFulfillDialog = (order: Sale) => {
    setActionError('');
    setFulfillingOrder(order);
    setCourierName(order.deliveryCourierName || '');
    setTrackingInfo(order.deliveryTrackingInfo || '');
    setFulfillDeliveryFee(String(Math.round(order.deliveryFee || 0)));
  };

  const openRejectDialog = (order: Sale) => {
    setActionError('');
    setRejectingOrder(order);
    setRejectionReason('');
  };

  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingOrder) return;
    try {
      setIsAccepting(true);
      setActionError('');
      const feeNum = Number(acceptDeliveryFee.replace(/\D/g, '')) || 0;
      const cashNum = Number(acceptCashReceived.replace(/\D/g, '')) || 0;

      const updated = await salesService.acceptOnlineOrder(acceptingOrder.id, {
        payment_method: acceptPaymentMethod,
        cash_received:
          acceptPaymentMethod === 'CASH'
            ? Math.max(cashNum, acceptingOrder.totalAmount)
            : undefined,
        payment_reference: acceptPaymentRef.trim() || undefined,
        delivery_fee:
          acceptingOrder.fulfillmentType === 'DELIVERY' ? feeNum : undefined,
      });

      setAcceptingOrder(null);
      onOrderProcessed(updated);
      onRefresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Gagal menerima pesanan online. Periksa ketersediaan stok.'
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleConfirmFulfill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillingOrder) return;
    try {
      setIsFulfilling(true);
      setActionError('');
      const feeNum = Number(fulfillDeliveryFee.replace(/\D/g, '')) || 0;

      const updated = await salesService.fulfillOnlineOrder(
        fulfillingOrder.id,
        {
          delivery_courier_name: courierName.trim() || undefined,
          delivery_tracking_info: trackingInfo.trim() || undefined,
          delivery_fee:
            fulfillingOrder.fulfillmentType === 'DELIVERY' ? feeNum : undefined,
        }
      );

      setFulfillingOrder(null);
      onOrderProcessed(updated);
      onRefresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Gagal menyelesaikan pengiriman pesanan.'
      );
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    if (!rejectionReason.trim()) {
      setActionError('Alasan penolakan wajib diisi.');
      return;
    }
    try {
      setIsRejecting(true);
      setActionError('');
      const updated = await salesService.rejectOnlineOrder(rejectingOrder.id, {
        rejection_reason: rejectionReason.trim(),
      });
      setRejectingOrder(null);
      onOrderProcessed(updated);
      onRefresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menolak pesanan online.'
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const renderFulfillmentIcon = (type?: string) => {
    if (type === 'DINE_IN') return <Utensils className="size-3.5 text-primary" />;
    if (type === 'DELIVERY') return <Truck className="size-3.5 text-primary" />;
    return <ShoppingBag className="size-3.5 text-primary" />;
  };

  const renderOrderCard = (order: Sale, mode: 'pending' | 'processing') => {
    const trackingUrl =
      storeSlug && order.publicTrackingToken
        ? `${window.location.origin}/s/${storeSlug}/orders/${order.publicTrackingToken}`
        : undefined;

    const buyerWaUrl = order.customerPhone
      ? buildBuyerCourierNotificationWhatsAppUrl({
          buyerPhone: order.customerPhone,
          buyerName: order.customerName || 'Pelanggan',
          storeName,
          invoiceNumber: order.invoiceNumber,
          courierName: order.deliveryCourierName,
          trackingInfo: order.deliveryTrackingInfo,
          trackingUrl,
        })
      : '';

    return (
      <Card key={order.id} className="space-y-3 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[11px]">
              {order.invoiceNumber}
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px]">
              {renderFulfillmentIcon(order.fulfillmentType)}
              {formatFulfillmentLabel(order.fulfillmentType || 'PICKUP')}
            </Badge>
          </div>
          <Badge variant="default" className="text-[10px]">
            {order.paymentMethod}
          </Badge>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-semibold text-foreground">
              {order.customerName || 'Pelanggan Online'}
            </span>
            {order.customerPhone && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {order.customerPhone}
              </span>
            )}
          </div>
          {order.customerEmail && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Email: {order.customerEmail}
            </p>
          )}
          {order.fulfillmentType === 'DINE_IN' && order.tableNumber && (
            <p className="mt-1 font-medium text-foreground">
              Meja: {order.tableNumber}
            </p>
          )}
          {order.fulfillmentType === 'PICKUP' && order.pickupTime && (
            <p className="mt-1 font-medium text-foreground">
              Waktu Ambil: {order.pickupTime}
            </p>
          )}
          {order.fulfillmentType === 'DELIVERY' && order.deliveryAddress && (
            <p className="mt-1 flex items-start gap-1 text-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{order.deliveryAddress}</span>
            </p>
          )}
          {order.customFieldLabel && order.customFieldValue && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <strong className="text-foreground">
                {order.customFieldLabel}:
              </strong>{' '}
              {order.customFieldValue}
            </p>
          )}
          {order.notes && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <strong className="text-foreground">Catatan:</strong> {order.notes}
            </p>
          )}
          {order.paymentReference && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <strong className="text-foreground">Ref Bayar:</strong>{' '}
              {order.paymentReference}
            </p>
          )}
        </div>

        <div className="divide-y divide-border text-xs">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 py-1.5"
            >
              <div>
                <span className="font-medium text-foreground">
                  {item.quantity}x {item.productName}
                </span>
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    + {item.modifiers.map((m) => m.name).join(', ')}
                  </p>
                )}
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                <CurrencyText value={item.subtotal} />
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-1 text-xs">
          {(order.deliveryFee ?? 0) > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Ongkos Kirim</span>
              <span className="tabular-nums text-foreground">
                <CurrencyText value={order.deliveryFee || 0} />
              </span>
            </div>
          )}
          <div className="flex items-center justify-between font-bold text-foreground">
            <span>Total Tagihan</span>
            <span className="text-sm tabular-nums">
              <CurrencyText value={order.totalAmount} />
            </span>
          </div>
        </div>

        {mode === 'pending' ? (
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openRejectDialog(order)}
              className="h-9 flex-1 gap-1.5 text-xs text-destructive hover:text-destructive"
            >
              <XCircle className="size-3.5" />
              Tolak
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => openAcceptDialog(order)}
              className="h-9 flex-1 gap-1.5 text-xs font-semibold"
            >
              <CheckCircle2 className="size-3.5" />
              Terima & Proses
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {(order.deliveryCourierName || order.deliveryTrackingInfo) && (
              <div className="rounded-md border border-border bg-accent/40 p-2 text-[11px]">
                {order.deliveryCourierName && (
                  <p>
                    <strong>Kurir:</strong> {order.deliveryCourierName}
                  </p>
                )}
                {order.deliveryTrackingInfo && (
                  <p className="truncate">
                    <strong>Tracking:</strong> {order.deliveryTrackingInfo}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {buyerWaUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 gap-1.5 text-xs"
                >
                  <a
                    href={buyerWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-3.5 text-success-text" />
                    Hubungi WA
                  </a>
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => openFulfillDialog(order)}
                className="h-9 flex-1 gap-1.5 text-xs font-semibold"
              >
                <Truck className="size-3.5" />
                {order.fulfillmentType === 'DELIVERY'
                  ? 'Input Kurir & Selesaikan'
                  : 'Tandai Selesai'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-2 pr-6">
              <SheetTitle className="text-base">
                Antrean Pesanan Online
              </SheetTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
                />
                Segarkan
              </Button>
            </div>
            <SheetDescription className="text-xs">
              Verifikasi pesanan dari toko online (/s/{storeSlug || 'toko'}),
              potong stok otomatis, dan kirim info kurir ke pelanggan.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as 'pending' | 'processing')
              }
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" className="gap-1.5 text-xs">
                  <Clock className="size-3.5" />
                  Menunggu ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="processing" className="gap-1.5 text-xs">
                  <PackageCheck className="size-3.5" />
                  Diproses / Kirim ({activeOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-3">
                {pendingOrders.length === 0 ? (
                  <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                    <Clock className="mb-2 size-7 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada pesanan menunggu konfirmasi
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pesanan baru dari pelanggan di halaman toko online akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  pendingOrders.map((order) =>
                    renderOrderCard(order, 'pending')
                  )
                )}
              </TabsContent>

              <TabsContent value="processing" className="space-y-3">
                {activeOrders.length === 0 ? (
                  <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                    <PackageCheck className="mb-2 size-7 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada pesanan yang sedang disiapkan
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pesanan pre-order atau pengiriman kurir yang sedang berjalan akan tampil di sini.
                    </p>
                  </div>
                ) : (
                  activeOrders.map((order) =>
                    renderOrderCard(order, 'processing')
                  )
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog Terima & Proses Pesanan Online */}
      <Dialog
        open={Boolean(acceptingOrder)}
        onOpenChange={(o) => !o && setAcceptingOrder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terima & Proses Pesanan Online</DialogTitle>
            <DialogDescription className="text-xs">
              Stok bahan/produk akan langsung dipotong (FIFO) dan pelanggan akan menerima email konfirmasi.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {acceptingOrder && (
            <form onSubmit={handleConfirmAccept} className="space-y-3 py-1">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">No. Invoice:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {acceptingOrder.invoiceNumber}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Total Pesanan:</span>
                  <span className="text-sm font-bold text-foreground">
                    <CurrencyText value={acceptingOrder.totalAmount} />
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Metode Pembayaran Terverifikasi</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'QRIS', 'TRANSFER'] as PaymentMethod[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAcceptPaymentMethod(m)}
                        className={`min-h-9 rounded-md border text-xs font-semibold ${
                          acceptPaymentMethod === m
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  )}
                </div>
              </div>

              {acceptingOrder.fulfillmentType === 'DELIVERY' && (
                <div className="space-y-1.5">
                  <Label htmlFor="accept-delivery-fee" className="text-xs">
                    Ongkos Kirim (Rp)
                  </Label>
                  <FormattedNumberInput
                    id="accept-delivery-fee"
                    value={acceptDeliveryFee}
                    onValueChange={(vals) => setAcceptDeliveryFee(vals.rawString)}
                    placeholder="0"
                  />
                </div>
              )}

              {acceptPaymentMethod === 'CASH' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="accept-cash-received" className="text-xs">
                    Nominal Tunai Diterima (Rp)
                  </Label>
                  <FormattedNumberInput
                    id="accept-cash-received"
                    value={acceptCashReceived}
                    onValueChange={(vals) => setAcceptCashReceived(vals.rawString)}
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="accept-pay-ref" className="text-xs">
                    Referensi Bukti Bayar / Mutasi (Opsional)
                  </Label>
                  <Input
                    id="accept-pay-ref"
                    value={acceptPaymentRef}
                    onChange={(e) => setAcceptPaymentRef(e.target.value)}
                    placeholder="Contoh: Mutasi QRIS / BCA Terverifikasi"
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAcceptingOrder(null)}
                  disabled={isAccepting}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isAccepting}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isAccepting && <Loader2 className="size-3.5 animate-spin" />}
                  Konfirmasi & Proses Pesanan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Selesaikan & Input Info Kurir */}
      <Dialog
        open={Boolean(fulfillingOrder)}
        onOpenChange={(o) => !o && setFulfillingOrder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selesaikan Pesanan & Informasi Kurir</DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan nama kurir dan tautan live tracking / nomor resi. Pelanggan akan menerima notifikasi email otomatis.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {fulfillingOrder && (
            <form onSubmit={handleConfirmFulfill} className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="fulfill-courier" className="text-xs">
                  Nama Kurir / Layanan Pengiriman
                </Label>
                <Input
                  id="fulfill-courier"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="Contoh: GoSend Instant - Pak Budi / Kurir Toko"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fulfill-tracking" className="text-xs">
                  Link Live Tracking / Nomor Resi / Info Pengambilan
                </Label>
                <Input
                  id="fulfill-tracking"
                  value={trackingInfo}
                  onChange={(e) => setTrackingInfo(e.target.value)}
                  placeholder="Contoh: https://track.gosend.id/... atau Nomor Resi"
                  className="h-9 text-xs"
                />
              </div>

              {fulfillingOrder.fulfillmentType === 'DELIVERY' && (
                <div className="space-y-1.5">
                  <Label htmlFor="fulfill-fee" className="text-xs">
                    Penyesuaian Ongkos Kirim (Rp)
                  </Label>
                  <FormattedNumberInput
                    id="fulfill-fee"
                    value={fulfillDeliveryFee}
                    onValueChange={(vals) => setFulfillDeliveryFee(vals.rawString)}
                    placeholder="0"
                  />
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFulfillingOrder(null)}
                  disabled={isFulfilling}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isFulfilling}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isFulfilling && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  Selesaikan & Kirim Info
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Tolak Pesanan Online */}
      <Dialog
        open={Boolean(rejectingOrder)}
        onOpenChange={(o) => !o && setRejectingOrder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Tolak Pesanan Online
            </DialogTitle>
            <DialogDescription className="text-xs">
              Berikan alasan pembatalan yang jelas untuk diinformasikan kepada pelanggan.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {rejectingOrder && (
            <form onSubmit={handleConfirmReject} className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="reject-reason" className="text-xs">
                  Alasan Penolakan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Mohon maaf, stok varian ini baru saja habis di outlet kami."
                  rows={3}
                  className="text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingOrder(null)}
                  disabled={isRejecting}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isRejecting}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isRejecting && <Loader2 className="size-3.5 animate-spin" />}
                  Batalkan Pesanan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
