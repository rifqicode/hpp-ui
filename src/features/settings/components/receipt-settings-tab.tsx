import * as React from 'react';
import {
  Printer,
  Save,
  Loader2,
  Check,
  Receipt,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { CurrencyText } from '@/components/ui/currency-text';
import { FeatureGuidanceTour, GuidanceTourTrigger } from '@/features/guidance';
import { settingsService } from '../services/settings-service';
import type { StoreInfo, ReceiptConfig } from '../types';

interface ReceiptSettingsTabProps {
  store: StoreInfo | null;
  onUpdated?: (updatedStore: StoreInfo) => void;
}

const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  paper_size: '58mm',
  header_text: '',
  footer_text: 'Terima kasih atas kunjungan Anda!',
  show_logo: false,
  show_cashier_name: true,
  show_customer_phone: true,
  show_notes: true,
};

export function ReceiptSettingsTab({ store, onUpdated }: ReceiptSettingsTabProps) {
  const [config, setConfig] = React.useState<ReceiptConfig>(() => {
    const existing = store?.receipt_config || store?.receiptConfig;
    return {
      paper_size: existing?.paper_size || DEFAULT_RECEIPT_CONFIG.paper_size,
      header_text: existing?.header_text ?? DEFAULT_RECEIPT_CONFIG.header_text,
      footer_text: existing?.footer_text ?? DEFAULT_RECEIPT_CONFIG.footer_text,
      show_logo: existing?.show_logo ?? DEFAULT_RECEIPT_CONFIG.show_logo,
      show_cashier_name: existing?.show_cashier_name ?? DEFAULT_RECEIPT_CONFIG.show_cashier_name,
      show_customer_phone: existing?.show_customer_phone ?? DEFAULT_RECEIPT_CONFIG.show_customer_phone,
      show_notes: existing?.show_notes ?? DEFAULT_RECEIPT_CONFIG.show_notes,
    };
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (store?.receipt_config || store?.receiptConfig) {
      const existing = store.receipt_config || store.receiptConfig;
      setConfig({
        paper_size: existing?.paper_size || DEFAULT_RECEIPT_CONFIG.paper_size,
        header_text: existing?.header_text ?? DEFAULT_RECEIPT_CONFIG.header_text,
        footer_text: existing?.footer_text ?? DEFAULT_RECEIPT_CONFIG.footer_text,
        show_logo: existing?.show_logo ?? DEFAULT_RECEIPT_CONFIG.show_logo,
        show_cashier_name: existing?.show_cashier_name ?? DEFAULT_RECEIPT_CONFIG.show_cashier_name,
        show_customer_phone: existing?.show_customer_phone ?? DEFAULT_RECEIPT_CONFIG.show_customer_phone,
        show_notes: existing?.show_notes ?? DEFAULT_RECEIPT_CONFIG.show_notes,
      });
    }
  }, [store]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await settingsService.updateStoreProfile({
        receipt_config: config,
      });
      setSuccessMsg('Pengaturan struk berhasil disimpan.');
      onUpdated?.(updated);
      window.dispatchEvent(
        new CustomEvent('guidance-task-success', { detail: { feature: 'receipt_config' } })
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan struk.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Form Konfigurasi Struk */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-2xl border-border shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">Pengaturan Format Struk & Printer</CardTitle>
              <GuidanceTourTrigger feature="receipt_config" />
            </div>
            <CardDescription className="text-xs">
              Sesuaikan ukuran kertas printer thermal dan informasi yang tercetak pada struk transaksi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="mb-4">
                <FeedbackAlert variant="success" onDismiss={() => setSuccessMsg('')}>
                  {successMsg}
                </FeedbackAlert>
              </div>
            )}
            {errorMsg && (
              <div className="mb-4">
                <FeedbackAlert variant="error" onDismiss={() => setErrorMsg('')}>
                  {errorMsg}
                </FeedbackAlert>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Ukuran Kertas */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Ukuran Kertas Thermal</Label>
                <div data-guidance="paper-size" className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, paper_size: '58mm' }))}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      config.paper_size === '58mm'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground'
                        : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <Smartphone className="size-4 text-primary" />
                        <span>58mm (Thermal Mini)</span>
                      </div>
                      {config.paper_size === '58mm' && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      Standar printer Bluetooth portable, kasir mobile, & mPOS.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, paper_size: '80mm' }))}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      config.paper_size === '80mm'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground'
                        : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <Monitor className="size-4 text-primary" />
                        <span>80mm (Desktop / POS)</span>
                      </div>
                      {config.paper_size === '80mm' && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      Standar printer kasir USB/LAN desktop restoran & kafe.
                    </p>
                  </button>
                </div>
              </div>

              {/* Teks Header */}
              <div className="space-y-1.5">
                <Label htmlFor="header-text" className="text-xs font-semibold">
                  Teks Header Tambahan (Opsional)
                </Label>
                <Input
                  id="header-text"
                  value={config.header_text || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, header_text: e.target.value }))}
                  placeholder="Contoh: Slogan, Alamat Lengkap, atau Media Sosial"
                  className="h-10 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Ditampilkan tepat di bawah nama toko pada bagian paling atas struk.
                </p>
              </div>

              {/* Teks Footer */}
              <div className="space-y-1.5">
                <Label htmlFor="footer-text" className="text-xs font-semibold">
                  Teks Footer / Ucapan Terima Kasih
                </Label>
                <Textarea
                  data-guidance="footer-text"
                  id="footer-text"
                  value={config.footer_text || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Contoh: Terima kasih atas kunjungan Anda! Follow IG: @tokoanda"
                  rows={2}
                  className="text-xs resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  Pesan penutup atau catatan kebijakan retur pada bagian bawah struk.
                </p>
              </div>

              {/* Opsi Tampilan & Kolom Informasi */}
              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-xs font-semibold">Elemen Tambahan Struk</Label>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Tampilkan Nama Kasir</p>
                    <p className="text-[10px] text-muted-foreground">
                      Mencantumkan nama staf kasir yang melayani transaksi.
                    </p>
                  </div>
                  <Switch
                    checked={config.show_cashier_name}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, show_cashier_name: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Tampilkan No. HP Pelanggan</p>
                    <p className="text-[10px] text-muted-foreground">
                      Mencantumkan kontak telepon pelanggan bila tercatat.
                    </p>
                  </div>
                  <Switch
                    checked={config.show_customer_phone}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, show_customer_phone: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Tampilkan Catatan Pesanan</p>
                    <p className="text-[10px] text-muted-foreground">
                      Mencantumkan instruksi khusus (misal: "tanpa es, pedas sedang").
                    </p>
                  </div>
                  <Switch
                    checked={config.show_notes}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, show_notes: checked }))
                    }
                  />
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-2">
                <Button data-guidance="save-receipt-btn" type="submit" disabled={isSaving} className="w-full sm:w-auto text-xs font-semibold gap-1.5 h-10">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Struk'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Kolom Kanan: Live Preview & Test Print */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="rounded-2xl border-border shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                <span>Live Preview Struk</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Pratinjau langsung sesuai ukuran {config.paper_size}.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestPrint}
              className="text-xs gap-1.5 h-8 print:hidden"
            >
              <Printer className="size-3.5" />
              <span>Test Print</span>
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center p-4 bg-muted/40 rounded-b-2xl border-t border-border/60">
            {/* Thermal Receipt Container */}
            <div
              className="print-receipt-container bg-card text-foreground border border-border shadow-sm rounded-xl p-4 font-mono text-xs space-y-3 transition-all duration-300 w-full"
              data-paper-size={config.paper_size}
              style={{
                maxWidth: config.paper_size === '80mm' ? '380px' : '280px',
              }}
            >
              {/* Header */}
              <div className="text-center border-b border-border/80 pb-2">
                <h3 className="font-bold text-sm tracking-tight font-sans">
                  {store?.name || 'TOKO SAYA'}
                </h3>
                {config.header_text ? (
                  <p className="text-[10px] text-muted-foreground whitespace-pre-wrap font-sans mt-0.5">
                    {config.header_text}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-sans">
                    STRUK PEMBELIAN RESMI
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Invoice:</span>
                  <span className="font-bold">INV-PREVIEW-001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu:</span>
                  <span>
                    {new Date().toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                {config.show_cashier_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kasir:</span>
                    <span>Kasir Demo</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pelanggan:</span>
                  <span className="font-semibold">Budi Santoso</span>
                </div>
                {config.show_customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. HP:</span>
                    <span>0812-3456-7890</span>
                  </div>
                )}
                {config.show_notes && (
                  <div className="flex justify-between text-[10px] text-muted-foreground italic">
                    <span>Catatan:</span>
                    <span>Kurangi gula, kemasan pisah</span>
                  </div>
                )}
              </div>

              {/* Sample Items */}
              <div className="space-y-1.5 border-b border-border/80 pb-2">
                <div className="flex justify-between items-baseline text-[11px]">
                  <div className="truncate flex-1 pr-2">
                    <p className="font-medium truncate">Roti Cokelat Spesial</p>
                    <p className="text-[10px] text-muted-foreground">
                      2 x <CurrencyText value={15000} />
                    </p>
                  </div>
                  <span className="font-semibold shrink-0">
                    <CurrencyText value={30000} />
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-[11px]">
                  <div className="truncate flex-1 pr-2">
                    <p className="font-medium truncate">Croissant Butter Almond</p>
                    <p className="text-[10px] text-muted-foreground">
                      1 x <CurrencyText value={25000} />
                    </p>
                  </div>
                  <span className="font-semibold shrink-0">
                    <CurrencyText value={25000} />
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-[11px]">
                  <div className="truncate flex-1 pr-2">
                    <p className="font-medium truncate">Es Kopi Susu Aren</p>
                    <p className="text-[10px] text-muted-foreground">
                      1 x <CurrencyText value={18000} />
                    </p>
                  </div>
                  <span className="font-semibold shrink-0">
                    <CurrencyText value={18000} />
                  </span>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span><CurrencyText value={73000} /></span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Diskon Promo:</span>
                  <span className="text-destructive">-<CurrencyText value={5000} /></span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span>TOTAL:</span>
                  <span className="text-foreground"><CurrencyText value={68000} /></span>
                </div>
                <div className="flex justify-between text-muted-foreground pt-0.5">
                  <span>Metode Bayar:</span>
                  <span className="font-semibold">TUNAI</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Uang Diterima:</span>
                  <span><CurrencyText value={100000} /></span>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Kembalian:</span>
                  <span className="text-emerald-600"><CurrencyText value={32000} /></span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-1 text-[10px] text-muted-foreground font-sans whitespace-pre-wrap">
                {config.footer_text || 'Terima kasih atas kunjungan Anda!'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Guidance Tour */}
      <FeatureGuidanceTour feature="receipt_config" />
    </div>
  );
}
