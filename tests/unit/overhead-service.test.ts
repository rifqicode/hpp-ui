import { beforeEach, describe, expect, it, vi } from 'vitest'
import { overheadService } from '@/features/overheads/services/overhead-service'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api-client', () => ({ default: http }))
const raw = { id: 'oh1', store_id: 's1', name: 'Gas', category: 'PRODUCTION', default_amount: '15000', notes: 'Dapur', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
const local = { id: 'oh1', storeId: 's1', name: 'Gas', category: 'PRODUCTION', defaultAmount: 15000, notes: 'Dapur', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
const key = 'hpp_mock_overheads_data'
beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  for (const mock of Object.values(http)) mock.mockRejectedValue(new Error('Offline'))
})

describe('overhead service responses', () => {
  it('maps paginated responses and all query filters', async () => {
    http.get.mockResolvedValueOnce({ data: { items: [raw], total: 1, page: 2, limit: 5, total_pages: 3 } })
    expect(await overheadService.getPaginatedOverheads({ page: 2, limit: 5, search: 'Gas', activeOnly: false, category: 'PRODUCTION' })).toEqual({ items: [local], total: 1, page: 2, limit: 5, totalPages: 3 })
    expect(http.get).toHaveBeenCalledWith('/overheads?page=2&limit=5&search=Gas&active_only=false&category=PRODUCTION')
  })
  it.each([[], [raw], null])('handles legacy or empty list responses: %j', async data => {
    http.get.mockResolvedValueOnce({ data })
    const result = await overheadService.getPaginatedOverheads()
    expect(result.items).toHaveLength(Array.isArray(data) ? data.length : 0)
  })
  it.each([true, false])('filters backend records by active=%s and category', async activeOnly => {
    http.get.mockResolvedValueOnce({ data: { items: [raw, { ...raw, id: 'oh2', category: 'OPERATIONAL', is_active: false }] } })
    expect(await overheadService.getOverheads({ activeOnly, category: 'PRODUCTION' })).toHaveLength(activeOnly ? 1 : 0)
  })
  it('maps missing optional fields and loads a summary and detail', async () => {
    http.get.mockResolvedValueOnce({ data: [{ ...raw, category: '', default_amount: null, notes: '' }] })
    expect((await overheadService.getOverheads())[0]).toMatchObject({ category: 'PRODUCTION', defaultAmount: null, notes: '' })
    http.get.mockResolvedValueOnce({ data: { total_overheads: 1 } })
    expect(await overheadService.getOverheadSummary()).toEqual({ total_overheads: 1 })
    http.get.mockResolvedValueOnce({ data: raw })
    expect(await overheadService.getOverheadById('oh1')).toEqual(local)
  })
  it('persists created and updated server records in the fallback cache', async () => {
    http.post.mockResolvedValueOnce({ data: raw })
    expect(await overheadService.createOverhead({ name: 'Gas', category: 'PRODUCTION' })).toEqual(local)
    expect(http.post).toHaveBeenCalledWith('/overheads', { name: 'Gas', category: 'PRODUCTION', default_amount: null, notes: '', is_active: true })
    http.put.mockResolvedValueOnce({ data: { ...raw, name: 'Gas Baru' } })
    expect((await overheadService.updateOverhead('oh1', { name: 'Gas Baru', category: 'PRODUCTION', defaultAmount: 20000, notes: 'Baru', isActive: false })).name).toBe('Gas Baru')
    expect(http.put).toHaveBeenCalledWith('/overheads/oh1', { name: 'Gas Baru', category: 'PRODUCTION', default_amount: 20000, notes: 'Baru', is_active: false })
    expect(JSON.parse(localStorage.getItem(key)!)[0].name).toBe('Gas Baru')
    http.delete.mockResolvedValueOnce({})
    await overheadService.deleteOverhead('oh1')
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([])
  })
})

describe('overhead offline fallback', () => {
  it('searches, filters, and paginates cached records', async () => {
    localStorage.setItem(key, JSON.stringify([local, { ...local, id: 'oh2', name: 'Sewa', category: 'OPERATIONAL', isActive: false, notes: 'Kantor' }]))
    expect(await overheadService.getPaginatedOverheads({ activeOnly: true, category: 'PRODUCTION', search: 'dapur', page: 1, limit: 1 })).toMatchObject({ total: 1, items: [local] })
    expect(await overheadService.getPaginatedOverheads({ search: 'sewa', page: 2, limit: 1 })).toMatchObject({ total: 1, items: [] })
    expect(await overheadService.getOverheads({ activeOnly: false, category: 'OPERATIONAL' })).toHaveLength(1)
    http.get.mockResolvedValueOnce({ data: [] })
    expect(await overheadService.getOverheads({ activeOnly: true, category: 'PRODUCTION' })).toEqual([local])
    expect(await overheadService.getOverheadById('oh1')).toEqual(local)
    await expect(overheadService.getOverheadById('bad')).rejects.toThrow('not found')
  })
  it('creates, updates, and deletes a local record during an outage', async () => {
    const created = await overheadService.createOverhead({ name: 'Gas', category: 'PRODUCTION', defaultAmount: 0, notes: 'Dapur', isActive: false })
    expect(created).toMatchObject({ name: 'Gas', defaultAmount: 0, isActive: false })
    expect(await overheadService.updateOverhead(created.id, {})).toMatchObject({ name: 'Gas', defaultAmount: 0, isActive: false })
    expect(await overheadService.updateOverhead(created.id, { name: 'Listrik', category: 'OPERATIONAL', defaultAmount: null, notes: '', isActive: true })).toMatchObject({ name: 'Listrik', category: 'OPERATIONAL', defaultAmount: null, isActive: true })
    expect(await overheadService.updateOverhead('unknown', {})).toMatchObject({ name: 'Overhead', category: 'PRODUCTION', defaultAmount: null, isActive: true })
    await overheadService.deleteOverhead(created.id)
    expect(await overheadService.getOverheads()).toEqual([])
  })
  it('handles corrupt or inaccessible local storage', async () => {
    localStorage.setItem(key, 'bad json')
    expect(await overheadService.getOverheads()).toEqual([])
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full') })
    expect(await overheadService.createOverhead({ name: 'Gas', category: 'PRODUCTION' })).toMatchObject({ name: 'Gas' })
  })
  it('uses server templates and deduplicates fallback templates by name', async () => {
    http.post.mockResolvedValueOnce({ data: [raw] })
    expect(await overheadService.applyTemplate()).toEqual([local])
    http.post.mockResolvedValueOnce({ data: [] })
    const template = await overheadService.applyTemplate()
    expect(template).toHaveLength(5)
    expect(await overheadService.applyTemplate()).toHaveLength(5)
    expect(new Set(template.map(item => item.name)).size).toBe(5)
  })
})
