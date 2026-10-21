import { describe, expect, it } from 'vitest'
import { getAttachmentContentType, MAX_PO_ATTACHMENT_SIZE, PO_DOCUMENT_TYPES } from '@/features/purchase-orders/lib/attachment'

function documentFile(name: string, type = '', size = 1) {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('purchase order attachments', () => {
  it.each(Object.entries(PO_DOCUMENT_TYPES))('accepts %s documents', (extension, type) => {
    expect(getAttachmentContentType(documentFile(`invoice${extension}`, type))).toBe(type)
  })

  it.each(['', 'application/octet-stream'])('accepts generic browser MIME types: %s', (type) => {
    expect(getAttachmentContentType(documentFile('INVOICE.PDF', type))).toBe('application/pdf')
  })

  it.each(['invoice.png', 'invoice.pdf.exe', 'invoice'])('rejects unsupported extensions: %s', (name) => {
    expect(() => getAttachmentContentType(documentFile(name))).toThrow('Pilih dokumen PDF')
  })

  it.each([0, MAX_PO_ATTACHMENT_SIZE + 1])('rejects invalid file sizes: %i', (size) => {
    expect(() => getAttachmentContentType(documentFile('invoice.pdf', '', size))).toThrow('maksimal 10MB')
  })

  it('accepts the maximum file size', () => {
    expect(getAttachmentContentType(documentFile('invoice.pdf', '', MAX_PO_ATTACHMENT_SIZE))).toBe('application/pdf')
  })

  it('rejects a MIME type inconsistent with the extension', () => {
    expect(() => getAttachmentContentType(documentFile('invoice.pdf', 'image/png')))
      .toThrow('Format dokumen tidak sesuai')
  })

  it('enforces filename length at the boundary', () => {
    expect(getAttachmentContentType(documentFile(`${'a'.repeat(251)}.pdf`))).toBe('application/pdf')
    expect(() => getAttachmentContentType(documentFile(`${'a'.repeat(252)}.pdf`)))
      .toThrow('maksimal 255 karakter')
  })
})
