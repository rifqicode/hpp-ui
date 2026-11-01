import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { DayPicker, getDefaultClassNames, type DayButton } from 'react-day-picker';
import { id } from 'react-day-picker/locale';
import { format } from 'date-fns';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Calendar({
  className,
  classNames,
  components,
  labels,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      locale={id}
      showOutsideDays
      captionLayout="dropdown"
      navLayout="around"
      className={cn('relative w-[min(22rem,calc(100vw-1rem))] p-2 sm:p-3', className)}
      classNames={{
        root: defaults.root,
        months: 'relative flex flex-col gap-4',
        month: 'w-full space-y-2',
        month_caption: 'relative mx-11 flex h-11 items-center justify-center',
        dropdowns: 'flex items-center justify-center gap-1',
        dropdown_root: 'relative rounded-md px-2 py-2 focus-within:ring-2 focus-within:ring-ring',
        dropdown: 'absolute inset-0 size-full cursor-pointer opacity-0',
        caption_label: 'flex items-center gap-1 text-sm font-medium',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-0 top-0 size-11 cursor-pointer p-0 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-0 top-0 size-11 cursor-pointer p-0 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
        ),
        month_grid: 'w-full table-fixed border-collapse',
        weekday: 'h-8 text-center text-xs font-normal text-muted-foreground',
        day: 'relative p-0 text-center text-sm',
        today: '[&_button]:font-bold [&_button]:underline [&_button]:underline-offset-4',
        outside: 'text-muted-foreground',
        disabled: 'opacity-40',
        hidden: 'invisible',
        range_start: 'rounded-l-lg bg-accent',
        range_end: 'rounded-r-lg bg-accent',
        range_middle: 'bg-accent',
        ...classNames,
      }}
      labels={{
        labelNav: () => 'Navigasi kalender',
        labelPrevious: () => 'Bulan sebelumnya',
        labelNext: () => 'Bulan berikutnya',
        labelMonthDropdown: () => 'Pilih bulan',
        labelYearDropdown: () => 'Pilih tahun',
        labelGrid: date => format(date, 'MMMM yyyy', { locale: id }),
        labelDayButton: date => format(date, 'EEEE, d MMMM yyyy', { locale: id }),
        ...labels,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) => {
          const Icon =
            orientation === 'left'
              ? ChevronLeft
              : orientation === 'right'
                ? ChevronRight
                : ChevronDown;
          return <Icon aria-hidden="true" className={cn('size-4', chevronClass)} />;
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  day,
  modifiers,
  className,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      type="button"
      data-day={format(day.date, 'yyyy-MM-dd')}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'h-11 w-full cursor-pointer rounded-lg p-0 font-normal focus-visible:ring-2 focus-visible:ring-ring data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground',
        modifiers.outside && !modifiers.selected && 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Calendar };
