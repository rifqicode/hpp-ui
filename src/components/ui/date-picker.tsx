import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { endOfYear, startOfYear, addYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateInputLabel, formatDateInput, parseDateInput } from '@/lib/date-input';
import { cn } from '@/lib/utils';

type DatePickerProps = Omit<
  React.ComponentProps<typeof Button>,
  'value' | 'onChange' | 'type' | 'defaultValue'
> & {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
};

function DatePicker({
  value,
  onChange,
  min,
  max,
  required,
  name,
  placeholder = 'Pilih tanggal',
  disabled,
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const validation = React.useRef<HTMLInputElement>(null);
  const valueId = React.useId();
  const selected = parseDateInput(value);
  const lower = parseDateInput(min);
  const upper = parseDateInput(max);
  const today = formatDateInput(new Date());
  const invalid = Boolean(value && (!selected || (min && value < min) || (max && value > max)));

  React.useEffect(() => {
    validation.current?.setCustomValidity(
      invalid ? 'Pilih tanggal dalam rentang yang diizinkan.' : '',
    );
  }, [invalid]);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          {...props}
          ref={trigger}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-required={required || undefined}
          aria-describedby={[valueId, props['aria-describedby']].filter(Boolean).join(' ')}
          aria-invalid={props['aria-invalid'] ?? (invalid || undefined)}
          className={cn(
            'min-h-11 w-full min-w-0 cursor-pointer justify-start gap-2 text-left font-normal focus-visible:ring-2 focus-visible:ring-ring',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          <span id={valueId} className="truncate">
            {dateInputLabel(value) || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <input
        ref={validation}
        type="text"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        onInvalid={event => {
          event.preventDefault();
          trigger.current?.focus();
          setOpen(true);
        }}
      />
      <PopoverContent
        className="w-auto p-0"
        aria-label="Pilih tanggal"
        onOpenAutoFocus={event => {
          event.preventDefault();
          if (event.target instanceof HTMLElement) {
            event.target
              .querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')
              ?.focus();
          }
        }}
      >
        <Calendar
          mode="single"
          autoFocus
          selected={selected}
          defaultMonth={selected ?? upper ?? lower ?? new Date()}
          startMonth={lower ?? startOfYear(addYears(selected ?? new Date(), -100))}
          endMonth={upper ?? endOfYear(addYears(selected ?? new Date(), 20))}
          disabled={[...(lower ? [{ before: lower }] : []), ...(upper ? [{ after: upper }] : [])]}
          onSelect={date => select(formatDateInput(date))}
        />
        <div className="flex justify-between gap-2 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 cursor-pointer"
            disabled={Boolean((min && today < min) || (max && today > max))}
            onClick={() => select(today)}
          >
            Hari ini
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 cursor-pointer"
            disabled={!value}
            onClick={() => select('')}
          >
            Hapus tanggal
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export type { DatePickerProps };
