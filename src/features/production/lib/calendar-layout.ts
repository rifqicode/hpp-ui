import type { ProductionCalendarItem } from '../types';

export interface CalendarDay {
  date: string;
  items: ProductionCalendarItem[];
}

export interface CalendarSegment {
  item: ProductionCalendarItem;
  column: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface CalendarWeek {
  days: (CalendarDay | null)[];
  segments: CalendarSegment[];
  lanes: number;
}

// Split each interval at week boundaries and pack overlapping intervals into lanes.
export function buildCalendarWeeks(days: CalendarDay[]): CalendarWeek[] {
  if (!days.length) return [];
  const offset = (new Date(`${days[0].date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (CalendarDay | null)[] = [...Array<null>(offset).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const unique = new Map(days.flatMap((day) => day.items.map((item) => [item.id, item] as const)));
  const items = [...unique.values()].sort((a, b) => a.start_date.localeCompare(b.start_date) || b.end_date.localeCompare(a.end_date) || a.id.localeCompare(b.id));
  const weeks: CalendarWeek[] = [];
  let previousLanes = new Map<string, number>();
  for (let index = 0; index < cells.length; index += 7) {
    const weekDays = cells.slice(index, index + 7);
    const visible = weekDays.filter((day): day is CalendarDay => day !== null);
    const start = visible[0].date;
    const end = visible[visible.length - 1].date;
    const segments: CalendarSegment[] = [];
    const occupied: boolean[][] = [];
    const overlaps = items.filter((item) => item.start_date <= end && item.end_date >= start);
    // Reserve continuing batches first so they keep their lane across weeks.
    overlaps.sort((a, b) => Number(previousLanes.has(b.id)) - Number(previousLanes.has(a.id)));
    for (const item of overlaps) {
      const columns = weekDays.flatMap((day, column) => day && day.date >= item.start_date && day.date <= item.end_date ? [column] : []);
      const first = columns[0];
      const last = columns[columns.length - 1];
      let lane = previousLanes.get(item.id) ?? 0;
      while (columns.some((column) => occupied[lane]?.[column])) lane++;
      occupied[lane] ??= Array<boolean>(7).fill(false);
      for (const column of columns) occupied[lane][column] = true;
      segments.push({ item, column: first + 1, span: last - first + 1, lane, continuesBefore: item.start_date < start, continuesAfter: item.end_date > end });
    }
    previousLanes = new Map(segments.filter((segment) => segment.continuesAfter).map((segment) => [segment.item.id, segment.lane]));
    weeks.push({ days: weekDays, segments, lanes: occupied.length });
  }
  return weeks;
}
