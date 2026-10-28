import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CurrencyText } from '@/components/ui/currency-text';
import { ManualPaymentCard } from '@/features/storefront/components/manual-payment-card';
import { storefrontService } from '@/features/storefront/services/storefront-service';
import {
  buildOrderConfirmationWhatsAppUrl,
  formatFulfillmentLabel,
} from '@/features/storefront/lib/whatsapp';
import type { PublicOrderTrackingResponse } from '@/features/storefront/types';

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

export default function PublicOrderTrackingPage() {
  const { storeSlug = '', trackingToken = '' } = useParams<{
    storeSlug: string;
    trackingToken: string;
  }>();

  const [order, setOrder] = React.useState<PublicOrderTrackingResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copiedTracking, setCopiedTracking] = React.useState(false);

  const loadOrder = React.useCallback(
    async (silent = false) => {
      if (!storeSlug || !trackingToken) return;
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        const res = await storefrontService.getPublicOrderTracking(
          storeSlug,
          trackingToken
        );
        setOrder(res);
        setError('');
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : 'Data pesanan tidak ditemukan.'
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeSlug, trackingToken]
  );

  React.useEffect(() => {
    void loadOrder(false);
    const interval = window.setInterval(() => {
      void loadOrder(true);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [loadOrder]);

  const handleCopyTracking = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTracking(true);
      window.setTimeout(() => setCopiedTracking(false), 2000);
    } catch {
      // Ignore
    }
  };

  if (loading && !order) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            Memuat status pesanan...
          </span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h1 className="mt-3 text-base font-bold text-foreground">
          Pesanan Tidak Ditemukan
        </h1>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {error || 'Tautan pelacakan pesanan tidak valid.'}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 text-xs">
          <Link to={`/s/${storeSlug}`}>Kembali ke Toko</Link>
        </Button>
      </div>
    );
  }

  const config = order.store.storefront_config;
  const whatsappUrl = buildOrderConfirmationWhatsAppUrl({
    storePhone: config.contact.whatsapp_number || order.store.phone,
    storeName: order.store.name,
    order,
    trackingUrl: window.location.href,
  });

  const steps = [
    {
      id: 'PENDING_CONFIRMATION',
      label: 'Menunggu Konfirmasi',
      desc: 'Pesanan masuk ke antrean kasir',
      icon: Clock,
    },
    {
      id: 'IN_PROGRESS',
      label: 'Sedang Disiapkan',
      desc: 'Diverifikasi & sedang dibuat',
      icon: PackageCheck,
    },
    {
      id: 'COMPLETED',
      label:
        order.fulfillment_type === 'DELIVERY'
          ? 'Dikirim / Selesai'
          : 'Siap Diambil / Selesai',
      desc:
        order.fulfillment_type === 'DELIVERY'
          ? 'Kurir mengantar pesanan Anda'
          : 'Pesanan siap diserahkan',
      icon: CheckCircle2,
    },
  ];

  const currentStepIndex =
    order.status === 'PENDING_CONFIRMATION'
      ? 0
      : order.status === 'IN_PROGRESS'
      ? 1
      : order.status === 'COMPLETED'
      ? 2
      : -1;

  return (
    <div
      className="storefront-scope min-h-screen w-full"
      data-accent={config.theme.accent_color}
      data-surface={config.theme.surface_mode}
      data-radius={config.theme.border_radius}
    >
      <div className="mx-auto max-w-3xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <Link to={`/s/${storeSlug}`}>
              <ArrowLeft className="size-3.5" />
              Kembali ke {order.store.name}
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void loadOrder(true)}
            disabled={refreshing}
            className="h-9 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Perbarui Status
          </Button>
        </div>

        <Card className="py-5">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {order.invoice_number}
              </Badge>
              {order.status === 'CANCELLED' ? (
                <Badge variant="destructive">Pesanan Dibatalkan</Badge>
              ) : order.status === 'COMPLETED' ? (
                <Badge variant="default">Selesai</Badge>
              ) : order.status === 'IN_PROGRESS' ? (
                <Badge variant="secondary">Sedang Diproses</Badge>
              ) : (
                <Badge variant="outline">Menunggu Konfirmasi Kasir</Badge>
              )}
            </div>
            <CardTitle className="mt-2 text-base sm:text-lg">
              {order.status === 'CANCELLED'
                ? 'Mohon Maaf, Pesanan Anda Dibatalkan'
                : config.copywriting.order_success_title}
            </CardTitle>
            <CardDescription className="text-xs">
              {order.status === 'CANCELLED'
                ? 'Pesanan ini tidak dapat dilanjutkan oleh kasir toko.'
                : config.copywriting.order_success_message}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {order.status === 'CANCELLED' ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                <XCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <span className="font-semibold">Alasan Pembatalan: </span>
                  <span>
                    {order.rejection_reason ||
                      'Stok habis atau toko sedang tidak dapat menerima pesanan.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isDone = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-2.5 rounded-lg border p-3 ${
                        isCurrent
                          ? 'border-primary bg-accent/60'
                          : isDone
                          ? 'border-border bg-card'
                          : 'border-border bg-muted/30 opacity-60'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
                          isDone
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(order.delivery_courier_name || order.delivery_tracking_info) && (
              <div className="rounded-lg border border-primary/30 bg-accent/50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Truck className="size-4 text-primary" />
                  <span>Informasi Pengiriman & Pelacakan Kurir</span>
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  {order.delivery_courier_name && (
                    <p className="text-muted-foreground">
                      Kurir Pengantar:{' '}
                      <strong className="text-foreground">
                        {order.delivery_courier_name}
                      </strong>
                    </p>
                  )}
                  {order.delivery_tracking_info && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="break-all font-mono text-xs text-foreground">
                        {order.delivery_tracking_info}
                      </span>
                      <div className="flex items-center gap-2">
                        {isUrl(order.delivery_tracking_info) ? (
                          <Button
                            asChild
                            size="sm"
                            className="h-9 gap-1.5 text-xs font-semibold"
                          >
                            <a
                              href={order.delivery_tracking_info}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-3.5" />
                              Buka Live Tracking Kurir
                            </a>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyTracking(order.delivery_tracking_info)
                            }
                            className="h-9 gap-1.5 text-xs"
                          >
                            {copiedTracking ? (
                              <>
                                <Check className="size-3.5 text-success-text" />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5" />
                                Salin Resi / Info
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {whatsappUrl && (
              <Button
                asChild
                className="h-11 w-full gap-2 text-xs font-semibold sm:text-sm"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  Konfirmasi & Kirim Bukti via WhatsApp
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Instruksi Pembayaran ({order.payment_method})
            </CardTitle>
            <CardDescription className="text-xs">
              Gunakan rincian di bawah ini untuk menyelesaikan pembayaran Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManualPaymentCard
              paymentConfig={config.payment}
              selectedMethod={order.payment_method}
              totalAmount={order.total_amount}
              readOnly
            />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rincian Pesanan & Pemesan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nama Pemesan:</span>
                <p className="font-semibold text-foreground">
                  {order.customer_name} ({order.customer_phone})
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Metode Pesanan:</span>
                <p className="font-semibold text-foreground">
                  {formatFulfillmentLabel(order.fulfillment_type)}
                </p>
              </div>
              {order.table_number && (
                <div>
                  <span className="text-muted-foreground">Nomor Meja:</span>
                  <p className="font-semibold text-foreground">
                    {order.table_number}
                  </p>
                </div>
              )}
              {order.pickup_time && (
                <div>
                  <span className="text-muted-foreground">Waktu Ambil:</span>
                  <p className="font-semibold text-foreground">
                    {order.pickup_time}
                  </p>
                </div>
              )}
              {order.delivery_address && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">
                    Alamat Pengiriman:
                  </span>
                  <p className="font-semibold text-foreground">
                    {order.delivery_address}
                  </p>
                </div>
              )}
              {order.custom_field_label && order.custom_field_value && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">
                    {order.custom_field_label}:
                  </span>
                  <p className="font-semibold text-foreground">
                    {order.custom_field_value}
                  </p>
                </div>
              )}
              {order.notes && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Catatan:</span>
                  <p className="font-semibold text-foreground">{order.notes}</p>
                </div>
              )}
            </div>

            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.quantity}x {item.product_name} — {item.variant_name}
                    </p>
                    {item.modifiers.length > 0 && (
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

            <div className="space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal Produk</span>
                <span className="tabular-nums text-foreground">
                  <CurrencyText value={order.subtotal_amount} />
                </span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Ongkos Kirim</span>
                  <span className="tabular-nums text-foreground">
                    <CurrencyText value={order.delivery_fee} />
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 text-sm font-bold text-foreground">
                <span>Total Tagihan</span>
                <span className="tabular-nums">
                  <CurrencyText value={order.total_amount} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
