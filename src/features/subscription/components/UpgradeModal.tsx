import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscriptionGuards } from '../hooks/useSubscriptionGuards';
import { useCheckout } from '../hooks/useCheckout';
import { SUBSCRIPTION_USAGE_QUERY_KEY } from '../hooks/useSubscriptionUsage';
import { useAuthStore } from '@/store/use-auth-store';
import { loadMidtransSnap, payWithSnap } from '@/lib/midtrans';
import type { SubscriptionTier } from '../types/subscription';
import { Check, Sparkles, Zap, ShieldCheck, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  initialSelectedTier?: SubscriptionTier;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  reason,
  initialSelectedTier,
}) => {
  const queryClient = useQueryClient();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { tier } = useSubscriptionGuards();
  const { mutate: checkout, isPending } = useCheckout();
  const [successMessage, setSuccessMessage] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [processingTier, setProcessingTier] = React.useState<SubscriptionTier | null>(null);

  const handleSelectPlan = (selectedTier: SubscriptionTier) => {
    setErrorMessage('');
    setSuccessMessage('');
    setProcessingTier(selectedTier);

    checkout(selectedTier, {
      onSuccess: async (data) => {
        setProcessingTier(null);
        // Immediately close UpgradeModal to release Radix Dialog focus trap and body pointer-events lock
        onClose();

        try {
          await loadMidtransSnap(data.client_key);

          // Allow Radix Dialog unmount cycle to complete and restore body pointer events
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';

            payWithSnap(data.snap_token, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId] });
                queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
                queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
              },
              onPending: () => {
                queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId] });
                queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
              },
              onError: () => {
                queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
              },
              onClose: () => {
                document.body.style.pointerEvents = 'auto';
                queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId] });
                queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
              },
            });
          }, 150);
        } catch (e: unknown) {
          if (data.snap_redirect_url) {
            window.open(data.snap_redirect_url, '_blank');
          } else {
            console.error('Failed to load Midtrans Snap:', e);
          }
        }
      },
      onError: (err: unknown) => {
        setProcessingTier(null);
        const msg = err instanceof Error ? err.message : 'Gagal memulai transaksi pembayaran. Silakan coba lagi.';
        setErrorMessage(msg);
      },
    });
  };

  React.useEffect(() => {
    if (isOpen && initialSelectedTier && initialSelectedTier !== 'FREE' && initialSelectedTier !== tier) {
      handleSelectPlan(initialSelectedTier);
    }
  }, [isOpen, initialSelectedTier]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:p-6 p-4">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Tingkatkan Paket Bisnis Anda
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {reason || 'Dapatkan kapasitas penyimpanan lebih besar, akses staf multi-pengguna, dan fitur analitik hpp lengkap.'}
          </DialogDescription>
        </DialogHeader>

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Card Growth */}
          <div className={`border rounded-xl p-4 sm:p-5 relative flex flex-col justify-between transition-all ${
            tier === 'GROWTH' ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border bg-card hover:border-primary/40'
          }`}>
            {tier === 'GROWTH' && (
              <span className="absolute top-3 right-3 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                Paket Anda
              </span>
            )}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-bold text-base text-foreground">Growth</h3>
                <div className="text-sm font-bold text-foreground">
                  Rp 149.000<span className="text-[11px] text-muted-foreground font-normal">/bln</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Untuk bisnis kuliner yang mulai berkembang</p>
              <ul className="text-xs space-y-2 text-foreground/80 mb-4">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Hingga 3 Toko / Cabang</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>100 Bahan Baku & 50 Produk Resep</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>150 Batch Produksi per Bulan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>3 Staf per Toko</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Ekspor Laporan Excel/PDF</span>
                </li>
              </ul>
            </div>
            <Button
              disabled={tier === 'GROWTH' || isPending}
              onClick={() => handleSelectPlan('GROWTH')}
              className="w-full text-xs font-semibold h-9 rounded-lg"
              variant={tier === 'GROWTH' ? 'outline' : 'default'}
            >
              {isPending && processingTier === 'GROWTH' ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Memproses...</span>
                </span>
              ) : tier === 'GROWTH' ? (
                'Paket Aktif'
              ) : (
                'Pilih Paket Growth'
              )}
            </Button>
          </div>

          {/* Card Max Growth */}
          <div className={`border-2 rounded-xl p-4 sm:p-5 relative flex flex-col justify-between transition-all ${
            tier === 'MAX_GROWTH'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-indigo-500/70 bg-indigo-50/10 dark:bg-indigo-950/10 hover:border-indigo-600'
          }`}>
            <div className="absolute -top-2.5 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Zap className="size-3" /> Rekomendasi Waralaba
            </div>
            {tier === 'MAX_GROWTH' && (
              <span className="absolute top-3 right-3 text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold px-2 py-0.5 rounded">
                Paket Anda
              </span>
            )}
            <div className="mt-1">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-bold text-base text-foreground">Max Growth</h3>
                <div className="text-sm font-bold text-foreground">
                  Rp 499.000<span className="text-[11px] text-muted-foreground font-normal">/bln</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Kapasitas maksimal tanpa batas operasional</p>
              <ul className="text-xs space-y-2 text-foreground/80 mb-4">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Hingga 10 Toko / Cabang</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Kuota Bahan & Produk Tak Terbatas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Batch Produksi Tak Terbatas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>20 Staf per Toko</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Analitik Produksi & Multi-Role Penuh</span>
                </li>
              </ul>
            </div>
            <Button
              disabled={tier === 'MAX_GROWTH' || isPending}
              onClick={() => handleSelectPlan('MAX_GROWTH')}
              className="w-full text-xs font-semibold h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending && processingTier === 'MAX_GROWTH' ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Memproses...</span>
                </span>
              ) : tier === 'MAX_GROWTH' ? (
                'Paket Aktif'
              ) : (
                'Pilih Paket Max Growth'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
