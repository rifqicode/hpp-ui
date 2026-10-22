import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductionCalendar } from '@/features/production/components/production-calendar'
import { productionService } from '@/features/production/services/production-service'
import { calendar, calendarItem } from '../support/fixtures'
import { mockPageServices, resetSession } from '../support/page-services'
import { renderPage, deferred } from '../support/render'

beforeEach(() => { resetSession(); mockPageServices() })

describe('production calendar', () => {
  it('shows the loading state and then an empty month', async () => {
    const pending = deferred<typeof calendar>()
    vi.mocked(productionService.getCalendar).mockReturnValue(pending.promise)
    renderPage(<ProductionCalendar />, '/production/batches?tab=calendar')
    expect(screen.getByText('Memuat kalender produksi...')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Bulan berikutnya' })).toBeDisabled()
    pending.resolve(calendar)
    expect(await screen.findByText('Belum ada produksi pada bulan ini.')).toBeVisible()
  })
  it('changes months and preserves calendar filters in the URL', async () => {
    const user = userEvent.setup()
    renderPage(<ProductionCalendar />, '/production/batches?tab=calendar&date_basis=started_at')
    await screen.findByText('Belum ada produksi pada bulan ini.')
    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('month=2025-12')
    expect(screen.getByLabelText('Lokasi halaman')).not.toHaveTextContent('date_basis')
    await user.selectOptions(screen.getByLabelText('Status'), 'COMPLETED')
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('statuses=COMPLETED')
    await user.type(screen.getByLabelText('Cari produksi'), 'Roti')
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('search=Roti')
    await waitFor(() => expect(productionService.getCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ statuses: 'COMPLETED', search: 'Roti' }), 'store-1', expect.any(AbortSignal)))
  })
  it('links a batch to its detail and supports keyboard day selection', async () => {
    const item = calendarItem()
    vi.mocked(productionService.getCalendar).mockResolvedValue({
      ...calendar, items: [item], summary: { ...calendar.summary, total: 1 },
      days: [{ date: '2026-01-01', item_ids: [item.id, 'deleted-batch'] }, { date: '2026-01-02', item_ids: [] }],
    })
    const user = userEvent.setup()
    renderPage(<ProductionCalendar />, '/production/batches?tab=calendar')
    const link = await screen.findByRole('link', { name: /BATCH-TEST-001, Roti Coklat/ })
    expect(link).toHaveAttribute('href', '/production/batches/batch-1')
    const today = screen.getByRole('button', { name: /Kamis, 0?1 Januari 2026, 1 batch/ })
    await user.click(today)
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: /Jumat, 0?2 Januari 2026, 0 batch/ })).toHaveFocus()
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('day=2026-01-02')
    expect(screen.getByText('Tidak ada produksi pada tanggal ini.')).toBeVisible()
  })
})
