import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BatchListPage from '@/pages/production/batch-list-page'
import { productionBatchService } from '@/features/production/services/production-batch-service'
import { useAuthStore } from '@/store/use-auth-store'
import { mockPageServices, resetSession } from '../support/page-services'
import { productionHead, productionLog } from '../support/production-batch-fixture'
import { renderPage } from '../support/render'

beforeEach(() => {
  resetSession(); mockPageServices()
  useAuthStore.setState({ permissions: ['production:read', 'production:write'] })
  vi.spyOn(productionBatchService, 'list').mockResolvedValue([productionHead({ logs: [productionLog(), productionLog({ id: 'log-2' })] })])
})
describe('production heads list', () => {
  it('shows one head with multiple variant details and links to head', async () => {
    vi.spyOn(productionBatchService, 'list').mockResolvedValue([
      productionHead({ source: 'MANUAL', logs: [productionLog(), productionLog({ id: 'log-2' })] }),
      productionHead({ id: 'head-pos', batch_number: 'PB-20261031-000002', source: 'POS', logs: [productionLog({ id: 'log-pos' })] }),
    ])
    renderPage(<BatchListPage />, '/production/batches?tab=list')
    expect((await screen.findAllByRole('link', { name: '2 varian produksi' }))[0]).toHaveAttribute('href', '/production/batches/head-1')
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.getAllByText(/Brownies - Original/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Manual').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('POS').length).toBeGreaterThanOrEqual(1)
  })
  it('searches variants and switches kanban/list views', async () => {
    const user = userEvent.setup(); renderPage(<BatchListPage />, '/production/batches?tab=list')
    await screen.findAllByText('PB-20261031-000001')
    fireEvent.change(screen.getByLabelText('Cari batch produksi'), { target: { value: 'NO-MATCH' } })
    expect(screen.getByText('Batch tidak ditemukan')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Cari batch produksi'), { target: { value: '' } })
    await user.click(screen.getByRole('tab', { name: 'Papan Kanban' }))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('tab=kanban')
    expect(screen.getByRole('heading', { name: /Antrian/ })).toBeVisible()
  })
  it('shows API failures with retry instead of an empty success state', async () => {
    vi.mocked(productionBatchService.list).mockRejectedValue(new Error('Offline'))
    renderPage(<BatchListPage />, '/production/batches')
    expect(await screen.findByRole('alert')).toHaveTextContent('Data produksi belum berhasil dimuat')
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeVisible()
  })
})
