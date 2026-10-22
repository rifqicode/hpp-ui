import { useState } from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { POAttachmentUpload } from '@/features/purchase-orders/components/po-attachment-upload'
import type { POAttachment } from '@/features/purchase-orders/lib/attachment'
import { purchaseOrderService } from '@/features/purchase-orders/services/po-service'
import { renderPage, deferred } from '../support/render'

const attachment = { name: 'invoice.pdf', url: 'https://example.com/invoice.pdf' }

function UploadExample({ initial = [], disabled = false, purpose = 'request', onBusy = vi.fn() }: { initial?: POAttachment[]; disabled?: boolean; purpose?: 'request' | 'completion'; onBusy?: (busy: boolean) => void }) {
  const [files, setFiles] = useState(initial)
  return <POAttachmentUpload value={files} onChange={setFiles} onUploadingChange={onBusy} disabled={disabled} purpose={purpose} />
}

describe('purchase attachment upload', () => {
  it('uploads a document, tracks busy state, and lets the user remove it', async () => {
    const upload = vi.spyOn(purchaseOrderService, 'uploadAttachment').mockResolvedValue(attachment)
    const onBusy = vi.fn()
    const user = userEvent.setup()
    renderPage(<UploadExample onBusy={onBusy} />)
    const file = new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('Pilih lampiran purchase'), file)
    expect(await screen.findByTitle('invoice.pdf')).toBeVisible()
    expect(upload).toHaveBeenCalledWith(file, expect.any(Function), 'request')
    expect(onBusy.mock.calls).toEqual([[true], [false]])
    await user.click(screen.getByRole('button', { name: 'Hapus lampiran invoice.pdf' }))
    expect(screen.queryByTitle('invoice.pdf')).not.toBeInTheDocument()
  })
  it('validates unsupported documents before making upload requests', async () => {
    const upload = vi.spyOn(purchaseOrderService, 'uploadAttachment')
    const user = userEvent.setup({ applyAccept: false })
    renderPage(<UploadExample />)
    await user.upload(screen.getByLabelText('Pilih lampiran purchase'), new File(['x'], 'invoice.exe'))
    expect(screen.getByRole('alert')).toHaveTextContent('Pilih dokumen PDF')
    expect(upload).not.toHaveBeenCalled()
  })
  it('rejects selecting more files than the remaining capacity', async () => {
    const upload = vi.spyOn(purchaseOrderService, 'uploadAttachment')
    const user = userEvent.setup()
    const initial = Array.from({ length: 9 }, (_, i) => ({ name: `${i}.pdf`, url: `https://example.com/${i}.pdf` }))
    renderPage(<UploadExample initial={initial} />)
    await user.upload(screen.getByLabelText('Pilih lampiran purchase'), [new File(['x'], 'a.pdf', { type: 'application/pdf' }), new File(['x'], 'b.pdf', { type: 'application/pdf' })])
    expect(screen.getByRole('alert')).toHaveTextContent('Maksimal 10 dokumen lampiran')
    expect(upload).not.toHaveBeenCalled()
  })
  it('shows progress and locks file controls while a completion document is uploading', async () => {
    const pending = deferred<POAttachment>()
    const upload = vi.spyOn(purchaseOrderService, 'uploadAttachment').mockImplementation((_file, onProgress) => { onProgress?.(50); return pending.promise })
    const user = userEvent.setup()
    renderPage(<UploadExample purpose="completion" />)
    const file = new File(['x'], 'invoice.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('Pilih lampiran purchase'), file)
    expect(screen.getByText('Mengunggah dokumen 50%')).toBeVisible()
    expect(screen.getByLabelText('Pilih lampiran purchase')).toBeDisabled()
    expect(upload).toHaveBeenCalledWith(file, expect.any(Function), 'completion')
    pending.resolve(attachment)
    await waitFor(() => expect(screen.queryByText('Mengunggah dokumen 50%')).not.toBeInTheDocument())
  })
  it('retains successfully uploaded files when a subsequent upload fails', async () => {
    vi.spyOn(purchaseOrderService, 'uploadAttachment').mockResolvedValueOnce(attachment).mockRejectedValueOnce(new Error('Upload terputus'))
    const user = userEvent.setup()
    renderPage(<UploadExample />)
    await user.upload(screen.getByLabelText('Pilih lampiran purchase'), [new File(['x'], 'invoice.pdf', { type: 'application/pdf' }), new File(['x'], 'second.pdf', { type: 'application/pdf' })])
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload terputus')
    expect(screen.getByTitle('invoice.pdf')).toBeVisible()
    expect(screen.getByLabelText('Pilih lampiran purchase')).toBeEnabled()
  })
  it('blocks uploads and deletions when disabled', async () => {
    const upload = vi.spyOn(purchaseOrderService, 'uploadAttachment')
    const user = userEvent.setup()
    renderPage(<UploadExample initial={[attachment]} disabled />)
    expect(screen.getByLabelText('Pilih lampiran purchase')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Hapus lampiran invoice.pdf' }))
    expect(screen.getByTitle('invoice.pdf')).toBeVisible()
    expect(upload).not.toHaveBeenCalled()
  })
})
