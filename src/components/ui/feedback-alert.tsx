import { useEffect, useRef, type ComponentProps } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackVariant = 'success' | 'error' | 'info' | 'loading';

const variants: Record<FeedbackVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  info: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
  loading: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
};

const icons = { success: CheckCircle2, error: AlertCircle, info: Info, loading: Loader2 };

export function FeedbackAlert({
  variant = 'info',
  className,
  children,
  onDismiss,
  ...props
}: ComponentProps<'div'> & { variant?: FeedbackVariant; onDismiss?: () => void }) {
  const Icon = icons[variant];
  const dismissRef = useRef(onDismiss);
  const canDismiss = Boolean(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (variant !== 'success' || !canDismiss) return;
    const timeout = window.setTimeout(() => dismissRef.current?.(), 4000);
    return () => window.clearTimeout(timeout);
  }, [variant, children, canDismiss]);

  return (
    <div
      {...props}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      className={cn('flex items-start gap-2.5 rounded-lg border p-3 text-sm leading-5', variants[variant], className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', variant === 'loading' && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
      <span className="min-w-0 flex-1 break-words">{children}</span>
      {onDismiss && variant !== 'loading' && (
        <Button type="button" variant="ghost" aria-label="Tutup notifikasi" onClick={onDismiss} className="-my-2 -mr-2 min-h-11 min-w-11 shrink-0 p-0 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
