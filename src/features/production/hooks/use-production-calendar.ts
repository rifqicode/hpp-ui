import { useSearchParams } from 'react-router-dom';
import { useProductionCalendarQuery } from './use-production-query';
import type { ProductionCalendarFilters } from '../types';

export function shiftMonth(month: string, offset: number): string {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, value - 1 + offset, 1);
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function useProductionCalendar() {
  const [params, setParams] = useSearchParams();
  const filters: ProductionCalendarFilters = {
    month: params.get('month') || undefined,
    statuses: params.get('statuses') || undefined,
    product_id: params.get('product_id') || undefined,
    search: params.get('search') || undefined,
  };
  const query = useProductionCalendarQuery(filters);
  const data = query.data;
  const month = data?.month;
  const itemMap = new Map((data?.items || []).map((item) => [item.id, item]));
  const days = (data?.days || []).map((day) => ({ date: day.date, items: day.item_ids.flatMap((id) => { const item = itemMap.get(id); return item ? [item] : []; }) }));
  const requestedDay = params.get('day');
  const selectedDay = days.find((day) => day.date === requestedDay)
    || days.find((day) => day.date === data?.today)
    || days[0];

  function update(values: Record<string, string | undefined>) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', 'calendar');
      next.delete('date_basis');
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  function moveMonth(offset: number) {
    if (month) update({ month: shiftMonth(month, offset), day: undefined });
  }

  function currentMonth() {
    if (!data) return;
    const current = data.today.slice(0, 7);
    if (month === current) void query.refetch();
    else update({ month: current, day: undefined });
  }

  return { ...query, filters, month, days, selectedDay, update, moveMonth, currentMonth };
}
