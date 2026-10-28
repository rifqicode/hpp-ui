import * as React from 'react';
import {
  Banknote,
  Building2,
  Check,
  Copy,
  Maximize2,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyText } from '@/components/ui/currency-text';
import type { PaymentMethod } from '../../sales/types';
import type { StorefrontPaymentConfig } from '../types';

interface ManualPaymentCardProps {
  paymentConfig: StorefrontPaymentConfig;
  selectedMethod?: PaymentMethod;
  onSelectMethod?: (method: PaymentMethod) => void;
  totalAmount?: number;
  readOnly?: boolean;
  compact?: boolean;
}

export function ManualPaymentCard({
  paymentConfig,
  selectedMethod = 'CASH',
  onSelectMethod,
  totalAmount,
  readOnly = false,
  compact = false,
}: ManualPaymentCardProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [isQrisZoomOpen, setIsQrisZoomOpen] = React.useState(false);

  const availableMethods = React.useMemo(() => {
    const list: {
      id: PaymentMethod;
      label: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];

    if (paymentConfig.enable_cash_on_cashier) {
      list.push({
        id: 'CASH',
        label: 'Bayar di Kasir / Tunai',
        subtitle:
          paymentConfig.cash_instruction ||
          'Bayar langsung saat mengambil atau menerima pesanan',
        icon: Banknote,
      });
    }
    if (paymentConfig.enable_qris) {
      list.push({
        id: 'QRIS',
        label: 'QRIS (E-Wallet & M-Banking)',
        subtitle: paymentConfig.qris_merchant_name
          ? `Merchant: ${paymentConfig.qris_merchant_name}`
          : 'Scan kode QRIS resmi toko',
        icon: QrCode,
      });
    }
    if (paymentConfig.enable_bank_transfer) {
      list.push({
        id: 'TRANSFER',
        label: 'Transfer Rekening Bank',
        subtitle:
          paymentConfig.bank_accounts.length > 0
            ? `${paymentConfig.bank_accounts.length} rekening tersedia`
            : 'Transfer manual ke rekening toko',
        icon: Building2,
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'CASH',
        label: 'Bayar di Kasir / Tunai',
        subtitle: 'Bayar langsung di kasir toko',
        icon: Banknote,
      });
    }

    return list;
  }, [paymentConfig]);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const activeMethod = readOnly
    ? selectedMethod
    : availableMethods.some((m) => m.id === selectedMethod)
    ? selectedMethod
    : availableMethods[0]?.id || 'CASH';

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div
          className={`grid gap-2 ${
            availableMethods.length > 1 && !compact
              ? 'sm:grid-cols-3'
              : 'grid-cols-1'
          }`}
          role="radiogroup"
          aria-label="Pilih metode pembayaran"
        >
          {availableMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = activeMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectMethod?.(method.id)}
                className={`flex min-h-11 items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? 'border-primary bg-accent/60 text-foreground'
                    : 'border-border bg-card text-foreground hover:bg-muted/50'
                }`}
              >
                <div
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-semibold">{method.label}</span>
                    {isSelected && (
                      <Badge variant="default" className="text-[10px]">
                        Dipilih
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {method.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalAmount !== undefined && totalAmount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <div>
            <span className="block text-[11px] text-muted-foreground">
              Nominal yang harus dibayar
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              <CurrencyText value={totalAmount} />
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCopy('amount', String(Math.round(totalAmount)))}
            className="h-9 gap-1.5 text-xs"
          >
            {copiedKey === 'amount' ? (
              <>
                <Check className="size-3.5 text-success-text" />
                Nominal Tersalin
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Salin Nominal
              </>
            )}
          </Button>
        </div>
      )}

      {activeMethod === 'CASH' && (
        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Instruksi Pembayaran Tunai / Kasir
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {paymentConfig.cash_instruction ||
              'Silakan lakukan pembayaran langsung di kasir toko atau saat pesanan diserahkan.'}
          </p>
        </div>
      )}

      {activeMethod === 'QRIS' && (
        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <QrCode className="size-4 text-primary" />
              <div>
                <span className="block text-xs font-semibold text-foreground">
                  Pembayaran QRIS Resmi
                </span>
                {paymentConfig.qris_merchant_name && (
                  <span className="block text-[11px] text-muted-foreground">
                    NMID / Merchant: {paymentConfig.qris_merchant_name}
                  </span>
                )}
              </div>
            </div>
            {paymentConfig.qris_image_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQrisZoomOpen(true)}
                className="h-9 gap-1.5 text-xs"
              >
                <Maximize2 className="size-3.5" />
                Perbesar QRIS
              </Button>
            )}
          </div>

          {paymentConfig.qris_image_url ? (
            <div className="mt-3 flex flex-col items-center rounded-lg border border-border bg-muted/30 p-3">
              <img
                src={paymentConfig.qris_image_url}
                alt={`Kode QRIS ${paymentConfig.qris_merchant_name || 'Toko'}`}
                className="max-h-56 w-auto rounded-md border border-border bg-background object-contain p-2"
              />
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Scan menggunakan GoPay, OVO, Dana, ShopeePay, atau Mobile Banking, lalu simpan bukti bayar.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Kode QRIS akan dikirimkan oleh kasir atau dapat diminta melalui WhatsApp toko.
            </p>
          )}
        </div>
      )}

      {activeMethod === 'TRANSFER' && (
        <div className="space-y-2.5 rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Rekening Tujuan Transfer Bank
            </span>
          </div>

          {paymentConfig.bank_accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Belum ada nomor rekening yang ditampilkan. Silakan hubungi WhatsApp toko untuk nomor rekening pembayaran.
            </p>
          ) : (
            <div className="grid gap-2">
              {paymentConfig.bank_accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {acc.bank_name || 'BANK'}
                      </Badge>
                      <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                        {acc.account_number}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      a.n. {acc.account_holder_name || '-'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(`bank-${acc.id}`, acc.account_number)
                    }
                    className="h-9 gap-1.5 text-xs"
                  >
                    {copiedKey === `bank-${acc.id}` ? (
                      <>
                        <Check className="size-3.5 text-success-text" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Salin No. Rek
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {paymentConfig.payment_instruction && (
        <p className="text-[11px] text-muted-foreground">
          {paymentConfig.payment_instruction}
        </p>
      )}

      <Dialog open={isQrisZoomOpen} onOpenChange={setIsQrisZoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kode QRIS Pembayaran</DialogTitle>
            <DialogDescription>
              {paymentConfig.qris_merchant_name ||
                'Scan QRIS di bawah ini sesuai nominal pesanan Anda.'}
            </DialogDescription>
          </DialogHeader>
          {paymentConfig.qris_image_url && (
            <div className="flex flex-col items-center gap-3 py-2">
              <img
                src={paymentConfig.qris_image_url}
                alt="QRIS Toko"
                className="max-h-[65vh] w-auto rounded-lg border border-border bg-background object-contain p-3"
              />
              {totalAmount !== undefined && totalAmount > 0 && (
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">
                    Total Tagihan:{' '}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    <CurrencyText value={totalAmount} />
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
