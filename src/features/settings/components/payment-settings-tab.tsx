import * as React from 'react';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Banknote,
  QrCode,
  Building,
  Check,
  Copy,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { Badge } from '@/components/ui/badge';
import { settingsService } from '../services/settings-service';
import type { StoreInfo, StorePaymentConfig, StoreBankAccount } from '../types';
import { FeatureGuidanceTour, GuidanceTourTrigger } from '@/features/guidance';

interface PaymentSettingsTabProps {
  store: StoreInfo | null;
  onUpdated?: (updatedStore: StoreInfo) => void;
}

const DEFAULT_PAYMENT_CONFIG: StorePaymentConfig = {
  enable_cash: true,
  enable_qris: false,
  qris_image_url: '',
  qris_merchant_name: '',
  enable_bank_transfer: false,
  bank_accounts: [],
  payment_instruction: '',
};

export function PaymentSettingsTab({ store, onUpdated }: PaymentSettingsTabProps) {
  const [config, setConfig] = React.useState<StorePaymentConfig>(() => {
    const existing = store?.payment_config || store?.paymentConfig;
    return {
      enable_cash: existing?.enable_cash ?? DEFAULT_PAYMENT_CONFIG.enable_cash,
      enable_qris: existing?.enable_qris ?? DEFAULT_PAYMENT_CONFIG.enable_qris,
      qris_image_url: existing?.qris_image_url ?? DEFAULT_PAYMENT_CONFIG.qris_image_url,
      qris_merchant_name: existing?.qris_merchant_name ?? DEFAULT_PAYMENT_CONFIG.qris_merchant_name,
      enable_bank_transfer: existing?.enable_bank_transfer ?? DEFAULT_PAYMENT_CONFIG.enable_bank_transfer,
      bank_accounts: existing?.bank_accounts ? [...existing.bank_accounts] : [],
      payment_instruction: existing?.payment_instruction ?? DEFAULT_PAYMENT_CONFIG.payment_instruction,
    };
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (store?.payment_config || store?.paymentConfig) {
      const existing = store.payment_config || store.paymentConfig;
      setConfig({
        enable_cash: existing?.enable_cash ?? DEFAULT_PAYMENT_CONFIG.enable_cash,
        enable_qris: existing?.enable_qris ?? DEFAULT_PAYMENT_CONFIG.enable_qris,
        qris_image_url: existing?.qris_image_url ?? DEFAULT_PAYMENT_CONFIG.qris_image_url,
        qris_merchant_name: existing?.qris_merchant_name ?? DEFAULT_PAYMENT_CONFIG.qris_merchant_name,
        enable_bank_transfer: existing?.enable_bank_transfer ?? DEFAULT_PAYMENT_CONFIG.enable_bank_transfer,
        bank_accounts: existing?.bank_accounts ? [...existing.bank_accounts] : [],
        payment_instruction: existing?.payment_instruction ?? DEFAULT_PAYMENT_CONFIG.payment_instruction,
      });
    }
  }, [store]);

  const handleAddBankAccount = () => {
    const newAccount: StoreBankAccount = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`,
      bank_name: '',
      account_number: '',
      account_holder_name: '',
    };
    setConfig((prev) => ({
      ...prev,
      bank_accounts: [...prev.bank_accounts, newAccount],
    }));
  };

  const handleUpdateBankAccount = (index: number, field: keyof StoreBankAccount, val: string) => {
    setConfig((prev) => {
      const updated = [...prev.bank_accounts];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, bank_accounts: updated };
    });
  };

  const handleRemoveBankAccount = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((_, i) => i !== index),
    }));
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await settingsService.updateStoreProfile({
        payment_config: config,
      });
      setSuccessMsg('Metode pembayaran berhasil disimpan.');
      onUpdated?.(updated);
      window.dispatchEvent(
        new CustomEvent('guidance-task-success', { detail: { feature: 'payment_config' } })
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan metode pembayaran.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Payment Config Form */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="rounded-2xl border-border shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">Pengaturan Metode Pembayaran</CardTitle>
                <GuidanceTourTrigger feature="payment_config" />
              </div>
              <CardDescription className="text-xs">
                Atur metode pembayaran yang aktif di POS kasir, kode QRIS toko, dan rekening transfer bank.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {successMsg && (
                <FeedbackAlert variant="success" onDismiss={() => setSuccessMsg('')}>
                  {successMsg}
                </FeedbackAlert>
              )}
              {errorMsg && (
                <FeedbackAlert variant="error" onDismiss={() => setErrorMsg('')}>
                  {errorMsg}
                </FeedbackAlert>
              )}

              {/* 1. Tunai / Cash */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <Label htmlFor="enable_cash" className="text-sm font-semibold cursor-pointer">
                      Pembayaran Tunai (Cash)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kasir dapat menerima uang tunai dan menghitung kembalian langsung di kasir.
                    </p>
                  </div>
                </div>
                <Switch
                  id="enable_cash"
                  checked={config.enable_cash}
                  onCheckedChange={(val) => setConfig((prev) => ({ ...prev, enable_cash: val }))}
                />
              </div>

              {/* 2. QRIS */}
              <div data-guidance="payment-qris" className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                      <QrCode className="size-5" />
                    </div>
                    <div>
                      <Label htmlFor="enable_qris" className="text-sm font-semibold cursor-pointer">
                        QRIS (Quick Response Code Indonesian Standard)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tampilkan QR code statis toko di kasir untuk scan pembayaran via e-wallet dan m-banking.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enable_qris"
                    checked={config.enable_qris}
                    onCheckedChange={(val) => setConfig((prev) => ({ ...prev, enable_qris: val }))}
                  />
                </div>

                {config.enable_qris && (
                  <div className="pt-3 border-t border-border/80 space-y-3.5 pl-1 sm:pl-10">
                    <div className="space-y-1.5">
                      <Label htmlFor="qris_merchant_name" className="text-xs font-medium">
                        Nama Merchant QRIS (NMID / Nama Toko)
                      </Label>
                      <Input
                        id="qris_merchant_name"
                        placeholder={store?.name || 'Contoh: TOKO ROTI SEJAHTERA'}
                        value={config.qris_merchant_name}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, qris_merchant_name: e.target.value }))
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="qris_image_url" className="text-xs font-medium">
                        URL Gambar QR Code QRIS
                      </Label>
                      <Input
                        id="qris_image_url"
                        placeholder="https://example.com/qris.png"
                        value={config.qris_image_url || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, qris_image_url: e.target.value }))
                        }
                        className="h-9 text-xs font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Masukkan link URL gambar barcode QRIS statis toko Anda.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Transfer Bank */}
              <div data-guidance="payment-bank" className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5">
                      <Building className="size-5" />
                    </div>
                    <div>
                      <Label htmlFor="enable_bank_transfer" className="text-sm font-semibold cursor-pointer">
                        Transfer Bank
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sediakan daftar nomor rekening toko untuk pembayaran via transfer manual.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enable_bank_transfer"
                    checked={config.enable_bank_transfer}
                    onCheckedChange={(val) => setConfig((prev) => ({ ...prev, enable_bank_transfer: val }))}
                  />
                </div>

                {config.enable_bank_transfer && (
                  <div className="pt-3 border-t border-border/80 space-y-4 pl-1 sm:pl-10">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Daftar Rekening Bank</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddBankAccount}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="size-3.5" />
                        Tambah Rekening
                      </Button>
                    </div>

                    {config.bank_accounts.length === 0 ? (
                      <div className="text-center py-4 px-3 rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                        Belum ada nomor rekening terdaftar. Klik &quot;Tambah Rekening&quot; untuk menambahkan rekening pertama.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {config.bank_accounts.map((acc, index) => (
                          <div
                            key={acc.id || index}
                            className="p-3 rounded-lg border border-border/90 bg-muted/20 space-y-2.5 relative group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                Rekening #{index + 1}
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBankAccount(index)}
                                className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                title="Hapus rekening"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Nama Bank</Label>
                                <Input
                                  placeholder="BCA / Mandiri / BRI"
                                  value={acc.bank_name}
                                  onChange={(e) => handleUpdateBankAccount(index, 'bank_name', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Nomor Rekening</Label>
                                <Input
                                  placeholder="1234567890"
                                  value={acc.account_number}
                                  onChange={(e) => handleUpdateBankAccount(index, 'account_number', e.target.value)}
                                  className="h-8 text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Atas Nama (Pemilik)</Label>
                                <Input
                                  placeholder="Nama Pemilik Rekening"
                                  value={acc.account_holder_name}
                                  onChange={(e) => handleUpdateBankAccount(index, 'account_holder_name', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button data-guidance="save-payment-btn" type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Simpan Pengaturan Pembayaran
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Right Column: Live Checkout Preview */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="rounded-2xl border-border shadow-xs bg-muted/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Pratinjau di Modal Kasir (POS)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Simulasi tampilan opsi pembayaran saat kasir melakukan proses Checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Opsi Metode Tab Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground">Pilihan Metode Kasir:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <div
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    config.enable_cash
                      ? 'border-primary/40 bg-card text-foreground shadow-xs'
                      : 'border-border/50 bg-muted/40 text-muted-foreground opacity-50 line-through'
                  }`}
                >
                  <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tunai</span>
                </div>
                <div
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    config.enable_qris
                      ? 'border-primary/40 bg-card text-foreground shadow-xs'
                      : 'border-border/50 bg-muted/40 text-muted-foreground opacity-50 line-through'
                  }`}
                >
                  <QrCode className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>QRIS</span>
                </div>
                <div
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    config.enable_bank_transfer
                      ? 'border-primary/40 bg-card text-foreground shadow-xs'
                      : 'border-border/50 bg-muted/40 text-muted-foreground opacity-50 line-through'
                  }`}
                >
                  <Building className="size-4 text-purple-600 dark:text-purple-400" />
                  <span>Transfer</span>
                </div>
              </div>
            </div>

            {/* QRIS Preview */}
            {config.enable_qris && (
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 text-center">
                <div className="font-semibold text-xs tracking-tight">
                  {config.qris_merchant_name || store?.name || 'NAMA TOKO'}
                </div>
                <div className="flex justify-center py-2">
                  {config.qris_image_url ? (
                    <img
                      src={config.qris_image_url}
                      alt="QRIS"
                      className="size-36 object-contain rounded-lg border border-border p-1 bg-white"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="size-36 rounded-lg border border-dashed border-border flex flex-col items-center justify-center bg-muted/40 text-muted-foreground text-[10px] p-2 text-center">
                      <QrCode className="size-10 mb-1 opacity-50" />
                      <span>Masukkan URL gambar untuk menampilkan QRIS</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Scan QRIS dengan aplikasi GoPay, OVO, ShopeePay, BCA, atau m-banking lain.
                </span>
              </div>
            )}

            {/* Bank Transfer Preview */}
            {config.enable_bank_transfer && (
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
                <span className="text-xs font-semibold">Rekening Pembayaran:</span>
                {config.bank_accounts.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">
                    Belum ada rekening yang diisi.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {config.bank_accounts.map((acc, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-bold uppercase">{acc.bank_name || 'BANK'}</div>
                          <div className="text-xs font-mono tracking-wider">{acc.account_number || '-'}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            a.n. {acc.account_holder_name || '-'}
                          </div>
                        </div>
                        {acc.account_number && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 shrink-0"
                            onClick={() => handleCopy(acc.account_number, i)}
                          >
                            {copiedIndex === i ? (
                              <>
                                <Check className="size-3 text-emerald-600" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {config.payment_instruction && (
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-foreground">
                <span className="font-semibold">Catatan: </span>
                {config.payment_instruction}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FeatureGuidanceTour feature="payment_config" />
    </div>
  );
}
