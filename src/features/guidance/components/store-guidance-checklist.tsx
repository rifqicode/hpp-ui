import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Package,
  Receipt,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGuidanceProgress } from '../hooks/use-guidance';
import { GUIDANCE_UI_ENABLED } from '../config/guidance-registry';

const STEP_ICONS: Record<string, React.ElementType> = {
  first_product: UtensilsCrossed,
  stock: Package,
  receipt_config: Receipt,
};

export function StoreGuidanceChecklist() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isWelcomeMode = searchParams.get('welcome') === '1';

  const { items, total, completed, percent, isAllCompleted, nextGuidance, isLoading } =
    useGuidanceProgress();

  const [isMinimized, setIsMinimized] = React.useState<boolean>(() => {
    if (isWelcomeMode) return false;
    return localStorage.getItem('ekatra_guidance_minimized') === 'true';
  });

  const toggleMinimized = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      localStorage.setItem('ekatra_guidance_minimized', String(next));
      return next;
    });
  };

  const handleDismissWelcome = () => {
    if (isWelcomeMode) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('welcome');
          return next;
        },
        { replace: true }
      );
    }
  };

  // If loading or all completed without welcome mode, hide
  if (isLoading || (isAllCompleted && !isWelcomeMode)) {
    return null;
  }

  // Guidance checklist is temporarily disabled on the UI per user request
  if (!GUIDANCE_UI_ENABLED) {
    return null;
  }

  return (
    <Card className="overflow-hidden border border-primary/20 bg-linear-to-r from-primary/5 via-background to-background shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">
                  {isAllCompleted
                    ? 'Selamat! Panduan Toko Selesai 🎉'
                    : isWelcomeMode
                    ? 'Selamat Datang di Ekatra! 🚀'
                    : 'Panduan Penyiapan Toko'}
                </h2>
                <Badge variant={isAllCompleted ? 'default' : 'secondary'} className="text-xs">
                  {completed}/{total} Selesai ({percent}%)
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isAllCompleted
                  ? 'Semua konfigurasi awal telah lengkap. Toko Anda siap beroperasi penuh.'
                  : 'Selesaikan langkah berikut agar operasional, resep HPP, dan nota toko Anda optimal.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isWelcomeMode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleDismissWelcome}
              >
                Tutup Sambutan
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={toggleMinimized}
            >
              {isMinimized ? (
                <>
                  <span>Buka Panduan</span>
                  <ChevronDown className="size-3.5" />
                </>
              ) : (
                <>
                  <span>Perkecil</span>
                  <ChevronUp className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Checklist Content */}
        {!isMinimized && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2 border-t border-border/60">
            {items.map((item) => {
              const Icon = STEP_ICONS[item.key] ?? Circle;
              const isNext = nextGuidance?.key === item.key;

              return (
                <div
                  key={item.key}
                  className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                    item.isCompleted
                      ? 'border-border/60 bg-muted/20 opacity-80'
                      : isNext
                      ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                      : 'border-border bg-card'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex size-6 items-center justify-center rounded-lg ${
                            item.isCompleted
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isNext
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <span className="text-xs font-semibold line-clamp-1">{item.config.title}</span>
                      </div>

                      {item.isCompleted ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : isNext ? (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                          Berikutnya
                        </Badge>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {item.config.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2">
                    {item.isCompleted ? (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {item.isSkipped ? 'Dilewati' : 'Sudah Selesai'}
                      </span>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant={isNext ? 'default' : 'outline'}
                        className="w-full h-7 text-xs font-medium"
                      >
                        <Link to={item.config.route}>
                          <span>{isNext ? 'Mulai Sekarang' : 'Buka Halaman'}</span>
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
