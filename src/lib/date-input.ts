import { format, isValid, parse } from 'date-fns';
import { id } from 'date-fns/locale';

export function parseDateInput(value?: string): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = parse(value, 'yyyy-MM-dd', new Date(2000, 0, 1));
  return isValid(date) && format(date, 'yyyy-MM-dd') === value ? date : undefined;
}

export function formatDateInput(date?: Date): string {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

export function dateInputLabel(value: string): string {
  const date = parseDateInput(value);
  return date ? format(date, 'dd MMM yyyy', { locale: id }) : '';
}
