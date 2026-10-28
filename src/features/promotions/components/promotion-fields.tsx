import { useId, type ComponentProps, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const selectClass =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1.5 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive md:text-sm dark:bg-card';

export function PromotionFormPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('min-w-0 gap-0 rounded-2xl border border-border/80 py-0 shadow-xs ring-0', className)}>
      <CardHeader className="border-b p-4 sm:px-5">
        <CardTitle className="text-base font-semibold">
          <h2>{title}</h2>
        </CardTitle>
        {description && (
          <CardDescription className="text-xs leading-5 sm:text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

export function Field({
  label,
  required,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: (id: string, hintId?: string) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <Label htmlFor={id} className="text-sm font-medium leading-5">
          {label}
        </Label>
        {required && (
          <span className="text-sm text-red-700 dark:text-red-300" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="text-sm text-muted-foreground">(opsional)</span>}
      </div>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  integer = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  integer?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(id, hintId) => (
        <FormattedNumberInput
          id={id}
          aria-describedby={hintId}
          className="h-9"
          value={value}
          valueType="string"
          allowDecimal={!integer}
          maxDecimals={4}
          onValueChange={({ rawString }) => {
            if (rawString !== value) onChange(rawString);
          }}
        />
      )}
    </Field>
  );
}

export function TextField({
  label,
  hint,
  error,
  required,
  optional,
  className,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional}>
      {(id, hintId) => (
        <Input
          {...props}
          id={id}
          aria-describedby={hintId}
          className={cn('h-9', className)}
        />
      )}
    </Field>
  );
}

export function CheckField({
  label,
  className,
  ...props
}: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cn('flex min-h-9 cursor-pointer items-center gap-3 text-sm', className)}>
      <input
        {...props}
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <span>{label}</span>
    </label>
  );
}
