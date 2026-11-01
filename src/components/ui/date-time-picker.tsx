import { DatePicker, type DatePickerProps } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DateTimePickerProps = DatePickerProps & { timeLabel?: string };

function DateTimePicker({
  value,
  onChange,
  min,
  max,
  name,
  className,
  disabled,
  required,
  timeLabel = 'Jam',
  ...props
}: DateTimePickerProps) {
  const [date = '', time = ''] = value.split('T');
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <div className="min-w-[10rem] flex-1">
        <DatePicker
          {...props}
          value={date}
          onChange={next => onChange(next ? `${next}T${time || '00:00'}` : '')}
          min={min?.slice(0, 10)}
          max={max?.slice(0, 10)}
          disabled={disabled}
          required={required}
          className={className}
        />
      </div>
      <Input
        type="time"
        value={time}
        onChange={event =>
          onChange(event.target.value && date ? `${date}T${event.target.value}` : '')
        }
        aria-label={timeLabel}
        aria-describedby={props['aria-describedby']}
        aria-invalid={props['aria-invalid']}
        disabled={disabled || !date}
        required={required}
        min={min?.slice(0, 10) === date ? min.slice(11) : undefined}
        max={max?.slice(0, 10) === date ? max.slice(11) : undefined}
        className={cn(
          'min-h-11 w-[7.5rem] shrink-0 focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      />
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
    </div>
  );
}

export { DateTimePicker };
