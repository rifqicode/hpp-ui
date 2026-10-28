import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Package,
  Receipt,
  UtensilsCrossed,
  Store,
  CreditCard,
  Factory,
  ShoppingCart,
  Check,
  SkipForward,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/use-auth-store';
import { useGuidanceProgress, useCompleteGuidanceMutation } from '@/features/guidance';

const STEP_ICONS: Record<string, ElementType> = {
  first_product: UtensilsCrossed,
  stock: Package,
  store_profile: Store,
  payment_config: CreditCard,
  receipt_config: Receipt,
  production: Factory,
  pos: ShoppingCart,
};

export default function StoreGuidancePage() {
  const { activeStoreId, activeStoreName } = useAuthStore();
  const { items, total, completed, percent, isAllCompleted, nextGuidance, isLoading } =
    useGuidanceProgress();
  const completeMutation = useCompleteGuidanceMutation();

  const handleComplete = (key: string) => {
    completeMutation.mutate({
      key,
      payload: { action: 'complete', skipped: false },
    });
  };

  const handleSkip = (key: string) => {
    completeMutation.mutate({
      key,
      payload: { action: 'skip', skipped: true },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Memuat panduan penyiapan toko...</p>
      </div>
    );
  }

  if (!activeStoreId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <Store className="size-12 text-muted-foreground/60" />
        <h2 className="mt-4 text-lg font-semibold">Pilih Toko Terlebih Dahulu</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Silakan pilih toko aktif dari menu navigasi untuk melihat panduan penyiapan toko.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Panduan Penyiapan Toko
            </h1>
            <Badge variant={isAllCompleted ? 'default' : 'secondary'} className="text-xs">
              {completed}/{total} Selesai ({percent}%)
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Langkah-langkah esensial untuk memaksimalkan konfigurasi produk, stok bahan, nota, dan
            kasir {activeStoreName ? `toko ${activeStoreName}` : 'toko Anda'}.
          </p>
        </div>
      </div>

      {/* Progress Overview Card */}
      <Card className="overflow-hidden border-primary/20 bg-linear-to-r from-primary/5 via-card to-card shadow-xs">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {isAllCompleted ? (
                  <PartyPopper className="size-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Sparkles className="size-6" />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  {isAllCompleted
                    ? 'Luar Biasa! Semua Panduan Selesai 🎉'
                    : 'Progres Penyiapan Operasional Toko'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isAllCompleted
                    ? 'Seluruh modul utama telah dikonfigurasi. Toko Anda siap bertransaksi secara optimal.'
                    : `${total - completed} langkah tersisa untuk melengkapi seluruh konfigurasi awal.`}
                </p>
              </div>
            </div>

            {nextGuidance && !isAllCompleted && (
              <Button asChild size="sm" className="gap-1.5 self-start sm:self-center font-medium">
                <Link to={nextGuidance.config.route}>
                  <span>Lanjutkan: {nextGuidance.config.title}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Kelengkapan Sistem</span>
              <span className="tabular-nums font-semibold text-foreground">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* Guidance Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const Icon = STEP_ICONS[item.key] ?? Circle;
          const isNext = nextGuidance?.key === item.key;
          const isMutatingThis =
            completeMutation.isPending && completeMutation.variables?.key === item.key;

          return (
            <Card
              key={item.key}
              data-testid={`guidance-card-${item.key}`}
              className={`flex flex-col justify-between transition-all ${
                item.isCompleted
                  ? 'border-border/60 bg-muted/20 opacity-90'
                  : isNext
                  ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                  : 'border-border bg-card hover:border-border/80'
              }`}
            >
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-8 items-center justify-center rounded-lg ${
                        item.isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isNext
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Langkah {index + 1}
                    </span>
                  </div>

                  {item.isCompleted ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] gap-1 font-medium"
                    >
                      <Check className="size-3" />
                      {item.isSkipped ? 'Dilewati' : 'Selesai'}
                    </Badge>
                  ) : isNext ? (
                    <Badge variant="default" className="text-[11px] font-medium">
                      Berikutnya
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      Belum Selesai
                    </Badge>
                  )}
                </div>

                <CardTitle className="mt-2 text-base font-semibold leading-snug line-clamp-2">
                  {item.config.title}
                </CardTitle>

                <CardDescription className="text-xs leading-relaxed line-clamp-3">
                  {item.config.description}
                </CardDescription>

                {item.config.steps.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground/80">
                    💡 Menyediakan {item.config.steps.length} panduan visual di halaman ini.
                  </p>
                )}
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                <div className="border-t border-border/60 pt-3">
                  {!item.isCompleted ? (
                    <div className="space-y-2">
                      <Button
                        asChild
                        variant={isNext ? 'default' : 'outline'}
                        size="sm"
                        className="w-full h-8 text-xs font-medium justify-center gap-1.5"
                      >
                        <Link to={item.config.route}>
                          <span>Buka & Mulai Panduan</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isMutatingThis}
                          onClick={() => handleComplete(item.key)}
                          data-testid={`complete-btn-${item.key}`}
                          className="flex-1 h-7 text-[11px] font-medium gap-1"
                        >
                          {isMutatingThis ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>Tandai Selesai</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isMutatingThis}
                          onClick={() => handleSkip(item.key)}
                          data-testid={`skip-btn-${item.key}`}
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2.5"
                        >
                          <SkipForward className="size-3" />
                          <span>Lewati</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        {item.isSkipped ? 'Panduan telah dilewati' : 'Panduan telah diselesaikan'}
                      </span>
                      {item.completedAt && (
                        <span>
                          {new Date(item.completedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
