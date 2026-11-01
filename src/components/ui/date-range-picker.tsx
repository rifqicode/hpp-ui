import { useId, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { addYears, endOfYear, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateInputLabel, formatDateInput, parseDateInput } from '@/lib/date-input';
import { cn } from '@/lib/utils';

type DateRangeValue = { start: string; end: string };

function DateRangePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  invalid,
  describedBy,
  className,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const valueId = useId();
  const from = parseDateInput(value.start);
  const to = parseDateInput(value.end);
  const lower = parseDateInput(min);
  const upper = parseDateInput(max);

  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <span id={labelId} className="block text-xs font-medium">
        Rentang tanggal
      </span>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-labelledby={labelId}
            aria-describedby={[valueId, describedBy].filter(Boolean).join(' ')}
            aria-invalid={invalid || undefined}
            className="min-h-11 w-full min-w-0 cursor-pointer justify-start gap-2 bg-background text-left font-normal focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            <span id={valueId} className="truncate">
              {from
                ? `${dateInputLabel(value.start)} – ${to ? dateInputLabel(value.end) : 'Pilih akhir'}`
                : 'Pilih tanggal mulai dan akhir'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          aria-label="Pilih rentang tanggal"
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
            mode="range"
            required
            resetOnSelect
            autoFocus
            footer={
              from
                ? `${dateInputLabel(value.start)} – ${to ? dateInputLabel(value.end) : 'Pilih tanggal akhir'}`
                : 'Pilih tanggal mulai'
            }
            classNames={{ footer: 'sr-only' }}
            selected={from ? { from, to } : undefined}
            defaultMonth={from ?? upper ?? lower ?? new Date()}
            startMonth={lower ?? startOfYear(addYears(new Date(), -100))}
            endMonth={upper ?? endOfYear(addYears(new Date(), 20))}
            disabled={[...(lower ? [{ before: lower }] : []), ...(upper ? [{ after: upper }] : [])]}
            onSelect={range =>
              onChange({ start: formatDateInput(range?.from), end: formatDateInput(range?.to) })
            }
          />
          <div className="flex justify-between gap-2 border-t p-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 cursor-pointer"
              disabled={!value.start && !value.end}
              onClick={() => onChange({ start: '', end: '' })}
            >
              Hapus tanggal
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Selesai
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateRangePicker };
