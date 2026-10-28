import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PromotionPageHeader({
  title,
  description,
  onBack,
  disabled,
  actions,
}: {
  title: string;
  description: ReactNode;
  onBack: () => void;
  disabled?: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={disabled}
        className="-ml-2 h-9 gap-1.5"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke promosi
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h1>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </div>
        </div>
        {actions}
      </div>
    </header>
  );
}
