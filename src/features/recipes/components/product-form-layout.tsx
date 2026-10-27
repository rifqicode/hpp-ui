import type { ComponentProps, ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { cn } from '@/lib/utils';

export function ProductInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn('h-11', className)} {...props} />;
}

export function ProductNumberInput({ className, ...props }: ComponentProps<typeof FormattedNumberInput>) {
  return <FormattedNumberInput className={cn('h-11', className)} {...props} />;
}

export function ProductSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn('h-11 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-card', className)} {...props} />;
}

export function ProductField({ id, label, required, optional, error, hint, children }: {
  id: string; label: string; required?: boolean; optional?: boolean; error?: string; hint?: ReactNode; children: ReactNode;
}) {
  return <div className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center gap-1"><Label htmlFor={id} className="leading-5">{label}</Label>{required && <span className="text-sm text-red-700 dark:text-red-300" aria-hidden="true">*</span>}{optional && <span className="text-sm text-muted-foreground">(opsional)</span>}</div>
    {children}
    {hint && <p id={`${id}-hint`} className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    {error && <p id={`${id}-error`} className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </div>;
}

export function ProductFormPanel({ title, description, children, className }: {
  title: string; description?: string; children: ReactNode; className?: string;
}) {
  return <Card className={cn('min-w-0 gap-0 border py-0 shadow-none ring-0', className)}>
    <CardHeader className="border-b p-4 sm:px-5"><CardTitle className="text-base font-semibold"><h2>{title}</h2></CardTitle>{description && <CardDescription className="text-xs leading-5 sm:text-sm">{description}</CardDescription>}</CardHeader>
    <CardContent className="space-y-4 p-4 sm:p-5">{children}</CardContent>
  </Card>;
}

export function ProductPageHeader({ title, description, backTo, onBack, actions }: {
  title: string; description: ReactNode; backTo?: string; onBack?: () => void; actions?: ReactNode;
}) {
  return <header className="space-y-3">
    {backTo && (onBack
      ? <Button type="button" variant="ghost" onClick={onBack} className="-ml-2 h-11 gap-1.5"><ArrowLeft className="size-4" aria-hidden />Kembali ke produk</Button>
      : <Button asChild variant="ghost" className="-ml-2 h-11 gap-1.5"><Link to={backTo}><ArrowLeft className="size-4" aria-hidden />Kembali ke produk</Link></Button>)}
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{title}</h1><div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div></div>{actions}</div>
  </header>;
}
