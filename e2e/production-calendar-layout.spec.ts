import { test, expect } from '@playwright/test';
import { buildCalendarWeeks } from '../src/features/production/lib/calendar-layout';
import type { ProductionCalendarItem } from '../src/features/production/types';

function batch(id: string, start: string, end: string): ProductionCalendarItem {
  return { id, batch_number: id, product_id: 'product', product_name: id, product_unit: 'pcs', status: 'COMPLETED', started_at: `${start}T03:00:00Z`, ended_at: `${end}T03:00:00Z`, start_date: start, end_date: end, qty_planned: '10', qty_actual: '10', total_cost: '100', hpp_per_unit: '10' };
}

function october(items: ProductionCalendarItem[]) {
  return Array.from({ length: 31 }, (_, index) => {
    const date = `2026-10-${String(index + 1).padStart(2, '0')}`;
    return { date, items: items.filter((item) => item.start_date <= date && item.end_date >= date) };
  });
}

test('a batch from 19 to 20 occupies one continuous two-column bar', () => {
  const weeks = buildCalendarWeeks(october([batch('two-days', '2026-10-19', '2026-10-20')]));
  const segments = weeks.flatMap((week) => week.segments);
  expect(segments).toHaveLength(1);
  expect(segments[0]).toMatchObject({ column: 1, span: 2, continuesBefore: false, continuesAfter: false });
});

test('intervals continue at week and month boundaries', () => {
  const weeks = buildCalendarWeeks(october([
    batch('previous-month', '2026-09-30', '2026-10-02'),
    batch('next-week', '2026-10-25', '2026-10-27'),
    batch('next-month', '2026-10-31', '2026-11-02'),
  ]));
  const segments = weeks.flatMap((week) => week.segments);
  expect(segments.filter((segment) => segment.item.id === 'previous-month')).toMatchObject([{ column: 4, span: 2, continuesBefore: true, continuesAfter: false }]);
  expect(segments.filter((segment) => segment.item.id === 'next-week')).toMatchObject([
    { column: 7, span: 1, continuesBefore: false, continuesAfter: true },
    { column: 1, span: 2, continuesBefore: true, continuesAfter: false },
  ]);
  expect(segments.find((segment) => segment.item.id === 'next-month')).toMatchObject({ column: 6, span: 1, continuesAfter: true });
});

test('overlapping batches never occupy the same date and lane', () => {
  const items = [
    batch('long', '2026-09-29', '2026-11-02'),
    batch('short', '2026-10-19', '2026-10-20'),
    batch('overlap', '2026-10-20', '2026-10-26'),
    batch('single', '2026-10-20', '2026-10-20'),
  ];
  const weeks = buildCalendarWeeks(october(items));
  for (const week of weeks) {
    const occupied = new Set<string>();
    for (const segment of week.segments) {
      for (let column = segment.column; column < segment.column + segment.span; column++) {
        const cell = `${segment.lane}:${column}`;
        expect(occupied.has(cell)).toBe(false);
        occupied.add(cell);
      }
    }
  }
  expect(weeks.flatMap((week) => week.segments).filter((segment) => segment.item.id === 'long')).toHaveLength(5);
});
