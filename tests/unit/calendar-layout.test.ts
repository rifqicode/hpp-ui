import { describe, expect, it } from 'vitest'
import { buildCalendarWeeks } from '@/features/production/lib/calendar-layout'
import { shiftMonth } from '@/features/production/hooks/use-production-calendar'
import { calendarItem } from '../support/fixtures'

describe('production calendar layout', () => {
  it('returns no weeks for an empty calendar', () => {
    expect(buildCalendarWeeks([])).toEqual([])
  })
  it('aligns Monday as the first column and pads the final week', () => {
    const [week] = buildCalendarWeeks([{ date: '2026-01-01', items: [] }])
    expect(week.days).toHaveLength(7)
    expect(week.days.slice(0, 3)).toEqual([null, null, null])
    expect(week.days[3]?.date).toBe('2026-01-01')
    expect(week.segments).toEqual([])
    expect(week.lanes).toBe(0)
  })
  it('deduplicates a batch listed on multiple days and splits it across weeks', () => {
    const item = calendarItem({ start_date: '2026-01-03', end_date: '2026-01-06' })
    const days = Array.from({ length: 7 }, (_, i) => ({ date: `2026-01-0${i + 1}`, items: [item] }))
    const weeks = buildCalendarWeeks(days)
    expect(weeks).toHaveLength(2)
    expect(weeks[0].segments).toHaveLength(1)
    expect(weeks[0].segments[0]).toMatchObject({ column: 6, span: 2, lane: 0, continuesBefore: false, continuesAfter: true })
    expect(weeks[1].segments[0]).toMatchObject({ column: 1, span: 2, lane: 0, continuesBefore: true, continuesAfter: false })
  })
  it('places overlapping batches in separate lanes and reuses lanes for disjoint batches', () => {
    const a = calendarItem({ id: 'a', start_date: '2026-01-01', end_date: '2026-01-02' })
    const b = calendarItem({ id: 'b', start_date: '2026-01-02', end_date: '2026-01-03' })
    const c = calendarItem({ id: 'c', start_date: '2026-01-03', end_date: '2026-01-03' })
    const [week] = buildCalendarWeeks(Array.from({ length: 4 }, (_, i) => ({ date: `2026-01-0${i + 1}`, items: [a, b, c] })))
    expect(week.segments.map(s => [s.item.id, s.lane])).toEqual([['a', 0], ['b', 1], ['c', 0]])
    expect(week.lanes).toBe(2)
  })
  it.each([['2026-01', -1, '2025-12'], ['2026-12', 1, '2027-01'], ['2024-02', 12, '2025-02']])('shifts %s by %i months', (month, offset, expected) => {
    expect(shiftMonth(String(month), Number(offset))).toBe(expected)
  })
})
