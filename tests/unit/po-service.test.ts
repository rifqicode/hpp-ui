import { beforeEach, describe, expect, it, vi } from 'vitest'
import { purchaseOrderService as service } from '@/features/purchase-orders/services/po-service'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('@/lib/api-client', () => ({ default: http }))
const raw = { id: 'po1', po_number: 'PO-1', status: 'PURCHASE_REQUEST', total_amount: '12000', items: [{ id: 'i1', stock_id: 's1', quantity: '2', unit_price: '6000', total_price: '12000' }], logs: [{ id: 'l1', action: 'CREATED' }] }
beforeEach(() => { vi.resetAllMocks(); for (const method of Object.values(http)) method.mockResolvedValue({ data: raw }) })

describe('purchase order response mapping and commands', () => {
  it.each(['paged', 'array', 'empty'])('handles %s list responses', async shape => {
    http.get.mockResolvedValueOnce({ data: shape === 'paged' ? { items: [raw] } : shape === 'array' ? [raw] : null })
    const result = await service.getPurchaseOrders()
    expect(result.items).toHaveLength(shape === 'empty' ? 0 : 1)
    if (result.items[0]) expect(result.items[0]).toMatchObject({ poNumber: 'PO-1', category: 'PURCHASE_ORDER', attachments: [], totalAmount: 12000, items: [{ quantity: 2, unitPrice: 6000, totalPrice: 12000 }], logs: [{ userName: '-' }] })
  })
  it.each(['legacy', 'named', 'multiple', 'empty'])('normalizes %s attachments', async shape => {
    const attachment = { url: 'https://example.com/invoice.pdf', name: 'Invoice' }
    http.get.mockResolvedValueOnce({ data: { ...raw, items: undefined, logs: undefined, total_amount: '', ...(shape === 'legacy' ? { attachment_url: attachment.url } : shape === 'named' ? { attachment_url: attachment.url, attachment_name: 'Invoice' } : shape === 'multiple' ? { attachments: [attachment], completion_attachments: [attachment] } : {}) } })
    const result = await service.getPurchaseOrderById('po1')
    expect(result.attachments).toHaveLength(shape === 'empty' ? 0 : 1)
    expect(result.items).toEqual([])
    expect(result.totalAmount).toBe(0)
  })
  it('sends create, update and approval DTOs', async () => {
    const input = { items: [{ stock_id: 's1', quantity: 2 }] }
    await service.createPurchaseOrder(input); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders', input)
    await service.updatePurchaseOrder('po1', input); expect(http.put).toHaveBeenLastCalledWith('/purchase-orders/po1', input)
    await service.approvePurchaseOrder('po1'); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders/po1/approve', {})
    await service.approvePurchaseOrder('po1', { supplier_id: 's1' }); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders/po1/approve', { supplier_id: 's1' })
    await service.rejectPurchaseOrder('po1', { reason: 'Salah' }); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders/po1/reject', { reason: 'Salah' })
    await service.completePurchaseOrder('po1', []); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders/po1/complete', { prices: [] })
    await service.completePurchaseOrder('po1', { prices: [], supplier_id: 's1' }); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders/po1/complete', { prices: [], supplier_id: 's1' })
    await service.cancelPurchaseOrder('po1'); expect(http.post).toHaveBeenLastCalledWith('/purchase-orders/po1/cancel')
    await service.getPurchaseOrderSummary(); expect(http.get).toHaveBeenLastCalledWith('/purchase-orders/summary')
  })
})

describe('purchase document storage', () => {
  it.each(['request', 'completion'] as const)('uploads a %s document and reports progress', async purpose => {
    const open = vi.fn(), header = vi.fn()
    class Request {
      status = 200; timeout = 0
      upload = { onprogress: undefined as undefined | ((event: { loaded: number; total: number; lengthComputable: boolean }) => void) }
      onload?: () => void
      open = open; setRequestHeader = header
      send() { this.upload.onprogress?.({ lengthComputable: false, loaded: 1, total: 2 }); this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 2 }); this.onload?.() }
    }
    vi.stubGlobal('XMLHttpRequest', Request)
    http.post.mockResolvedValueOnce({ data: { upload_url: 'https://example.com/upload', public_url: 'https://example.com/doc.pdf' } })
    const progress = vi.fn()
    expect(await service.uploadAttachment(new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' }), progress, purpose)).toEqual({ name: 'invoice.pdf', url: 'https://example.com/doc.pdf' })
    expect(open).toHaveBeenCalledWith('PUT', 'https://example.com/upload')
    expect(header).toHaveBeenCalledWith('Content-Type', 'application/pdf')
    expect(progress.mock.calls).toEqual([[50], [100]])
  })
  it.each(['http', 'network', 'timeout', 'abort'])('reports a storage %s failure', async kind => {
    class Request {
      status = 500; upload = {}; open = vi.fn(); setRequestHeader = vi.fn()
      onload?: () => void; onerror?: () => void; ontimeout?: () => void; onabort?: () => void
      send() { if (kind === 'http') this.onload?.(); else if (kind === 'network') this.onerror?.(); else if (kind === 'timeout') this.ontimeout?.(); else this.onabort?.() }
    }
    vi.stubGlobal('XMLHttpRequest', Request)
    http.post.mockResolvedValueOnce({ data: { upload_url: 'https://example.com/upload', public_url: 'https://example.com/doc.pdf' } })
    await expect(service.uploadAttachment(new File(['pdf'], 'invoice.pdf'))).rejects.toThrow(kind === 'http' ? 'HTTP 500' : kind === 'network' ? 'koneksi' : kind === 'timeout' ? 'terlalu lama' : 'dibatalkan')
  })
  it('rejects invalid documents and incomplete presigned responses', async () => {
    await expect(service.uploadAttachment(new File(['x'], 'bad.exe'))).rejects.toThrow('Pilih dokumen')
    http.post.mockResolvedValueOnce({ data: {} })
    await expect(service.uploadAttachment(new File(['pdf'], 'invoice.pdf'))).rejects.toThrow('URL upload')
  })
})
