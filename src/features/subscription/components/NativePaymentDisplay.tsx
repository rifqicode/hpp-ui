import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  Copy,
  Loader2,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyText } from '@/components/ui/currency-text';
import type { SubscriptionInvoice, PaymentInstructions } from '../types/subscription';

interface NativePaymentDisplayProps {
  invoice: SubscriptionInvoice;
  instructions?: PaymentInstructions;
  onCheckStatus: (invoiceId: string) => Promise<void>;
  onCancelInvoice?: (invoice: SubscriptionInvoice) => Promise<void>;
  isChecking?: boolean;
  statusMessage?: string;
}

export function NativePaymentDisplay({
  invoice,
  instructions,
  onCheckStatus,
  onCancelInvoice,
  isChecking = false,
  statusMessage,
}: NativePaymentDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<string>('mbanking');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Parse expiry timestamp
  const expiryTimestamp = instructions?.expires_at
    ? new Date(instructions.expires_at).getTime()
    : invoice.created_at
    ? new Date(invoice.created_at).getTime() + 24 * 60 * 60 * 1000
    : Date.now() + 24 * 60 * 60 * 1000;

  const [timeLeft, setTimeLeft] = useState<number>(() => Math.max(0, expiryTimestamp - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, expiryTimestamp - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryTimestamp]);

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  const isQRIS = instructions?.payment_method === 'qris' || invoice.payment_method === 'qris';
  const isMandiri = instructions?.payment_method === 'mandiri_va' || instructions?.bank === 'MANDIRI';
  const bankName = instructions?.bank || invoice.payment_method?.replace('_va', '').toUpperCase();

  const handleCancel = async () => {
    if (!onCancelInvoice) return;
    setIsCancelling(true);
    try {
      await onCancelInvoice(invoice);
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Expiry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" aria-hidden="true" />
          <span>Selesaikan pembayaran dalam</span>
        </div>
        <div className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
          {timeLeft > 0 ? formatCountdown(timeLeft) : 'Waktu Habis'}
        </div>
      </div>

      {statusMessage && (
        <div role="status" className="p-3 text-xs sm:text-sm rounded-lg bg-muted border border-border text-foreground">
          {statusMessage}
        </div>
      )}

      {/* Main Payment Card */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {isQRIS ? (
                <>
                  <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
                  QRIS Pembayaran Digital
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  Virtual Account {bankName}
                </>
              )}
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {invoice.invoice_number}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Total Amount Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-lg bg-muted/40 border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Tagihan</p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                <CurrencyText value={invoice.amount} />
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(invoice.amount.toString(), 'amount')}
              className="gap-1.5 self-start sm:self-auto h-8 text-xs"
            >
              {copiedField === 'amount' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Salin Jumlah
                </>
              )}
            </Button>
          </div>

          {/* QRIS Specific Display */}
          {isQRIS && (
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 bg-white dark:bg-zinc-950 text-center space-y-3">
              {instructions?.qr_url ? (
                <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-xs inline-block">
                  <img
                    src={instructions.qr_url}
                    alt="Kode QRIS Pembayaran"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground p-4">
                  <QrCode className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-xs">Kode QR sedang diproses</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Scan QRIS dengan aplikasi mobile pilihan Anda
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs">
                  BCA, Mandiri Livin', BRImo, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja, dll.
                </p>
              </div>
            </div>
          )}

          {/* Virtual Account Specific Display */}
          {!isQRIS && !isMandiri && instructions?.va_number && (
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Nomor Virtual Account ({bankName})</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg sm:text-xl font-bold text-foreground tracking-wider select-all">
                  {instructions.va_number}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy(instructions.va_number!, 'va')}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  {copiedField === 'va' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin No. VA
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Mandiri E-Channel Specific Display */}
          {isMandiri && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Kode Perusahaan (Biller Code)</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-bold text-foreground select-all">
                    {instructions?.biller_code || '-'}
                  </span>
                  {instructions?.biller_code && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(instructions.biller_code!, 'biller')}
                      className="h-7 px-2 text-xs"
                    >
                      {copiedField === 'biller' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Nomor Pelanggan (Bill Key)</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-bold text-foreground select-all">
                    {instructions?.bill_key || '-'}
                  </span>
                  {instructions?.bill_key && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(instructions.bill_key!, 'billkey')}
                      className="h-7 px-2 text-xs"
                    >
                      {copiedField === 'billkey' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step-by-Step Payment Guides Accordion */}
          <div className="rounded-lg border border-border/70 overflow-hidden text-xs">
            <div className="bg-muted/50 px-3.5 py-2.5 font-semibold text-foreground border-b border-border/60">
              Petunjuk Pembayaran
            </div>

            {isQRIS ? (
              <div className="p-3.5 space-y-2 text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Buka aplikasi mobile banking atau e-wallet apa pun yang mendukung QRIS.</li>
                  <li>Pilih menu <strong>Scan</strong> atau <strong>Bayar</strong>.</li>
                  <li>Arahkan kamera ke kode QR yang ditampilkan di atas.</li>
                  <li>Periksa nama merchant dan nominal tagihan yang tertera.</li>
                  <li>Konfirmasi dan masukkan PIN transaksi Anda. Pembayaran otomatis terverifikasi seketika.</li>
                </ol>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div className="flex gap-1.5 border-b border-border/60 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('mbanking')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeGuideTab === 'mbanking'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Mobile Banking
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('atm')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeGuideTab === 'atm'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    ATM
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('ibanking')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeGuideTab === 'ibanking'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Internet Banking
                  </button>
                </div>

                <div className="text-muted-foreground leading-relaxed">
                  {activeGuideTab === 'mbanking' && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Buka aplikasi Mobile Banking {bankName} di ponsel Anda.</li>
                      <li>
                        {isMandiri
                          ? 'Pilih menu Bayar > Cari penyedia layanan atau Multi Payment.'
                          : `Pilih menu Transfer > Virtual Account ${bankName}.`}
                      </li>
                      <li>
                        {isMandiri
                          ? `Masukkan Kode Biller (${instructions?.biller_code}) dan Bill Key (${instructions?.bill_key}).`
                          : `Masukkan nomor Virtual Account (${instructions?.va_number || '-'}).`}
                      </li>
                      <li>Pastikan nominal pembayaran dan rincian tagihan sesuai.</li>
                      <li>Masukkan PIN Anda untuk menyelesaikan pembayaran.</li>
                    </ol>
                  )}

                  {activeGuideTab === 'atm' && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Masukkan kartu ATM dan 6 digit PIN Anda.</li>
                      <li>
                        {isMandiri
                          ? 'Pilih menu Bayar/Beli > Lainnya > Lainnya > Multi Payment.'
                          : `Pilih Transaksi Lainnya > Transfer > ke Rekening Virtual Account ${bankName}.`}
                      </li>
                      <li>
                        {isMandiri
                          ? `Masukkan Kode Perusahaan (${instructions?.biller_code}) lalu Bill Key.`
                          : `Masukkan nomor Virtual Account (${instructions?.va_number || '-'}).`}
                      </li>
                      <li>Periksa informasi transaksi di layar ATM.</li>
                      <li>Tekan Ya / Konfirmasi untuk membayar. Simpan struk bukti transaksi.</li>
                    </ol>
                  )}

                  {activeGuideTab === 'ibanking' && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Login ke situs Internet Banking {bankName}.</li>
                      <li>
                        {isMandiri
                          ? 'Pilih menu Pembayaran > Multi Payment.'
                          : `Pilih menu Transfer Dana > Transfer ke Virtual Account ${bankName}.`}
                      </li>
                      <li>Masukkan data tagihan yang sesuai.</li>
                      <li>Otorisasi transaksi menggunakan token atau App otentikator Anda.</li>
                    </ol>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onCheckStatus(invoice.id)}
            disabled={isChecking || isCancelling}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isChecking ? 'Memeriksa Pembayaran…' : 'Cek Status Pembayaran'}
          </Button>
        </div>

        {onCancelInvoice && !showCancelConfirm && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isChecking || isCancelling}
            onClick={() => setShowCancelConfirm(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            Batalkan Tagihan
          </Button>
        )}
      </div>

      {/* Cancel Confirmation Dialog Card */}
      {showCancelConfirm && (
        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2.5">
          <div className="flex items-center gap-2 text-destructive font-semibold text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Konfirmasi Pembatalan Tagihan</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Apakah Anda yakin ingin membatalkan tagihan ini? Setelah dibatalkan, nomor tagihan dan Virtual Account ini tidak dapat digunakan lagi.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="destructive"
              disabled={isCancelling}
              onClick={() => void handleCancel()}
              className="gap-1 text-xs"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Membatalkan…
                </>
              ) : (
                'Ya, Batalkan Tagihan'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isCancelling}
              onClick={() => setShowCancelConfirm(false)}
              className="text-xs"
            >
              Kembali
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
