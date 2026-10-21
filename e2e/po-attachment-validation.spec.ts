import { test, expect } from '@playwright/test'
import { getAttachmentContentType, MAX_PO_ATTACHMENT_SIZE, PO_DOCUMENT_TYPES } from '../src/features/purchase-orders/lib/attachment'

function documentFile(name: string, size: number, type = ''): File {
  return { name, size, type } as File
}

test('PO attachments accept each document format up to 10MB, including browser MIME fallbacks', () => {
  for (const [extension, type] of Object.entries(PO_DOCUMENT_TYPES)) {
    expect(getAttachmentContentType(documentFile(`Penawaran${extension}`, MAX_PO_ATTACHMENT_SIZE, type))).toBe(type)
    expect(getAttachmentContentType(documentFile(`Penawaran${extension}`, 100))).toBe(type)
    expect(getAttachmentContentType(documentFile(`Penawaran${extension}`, 100, 'application/octet-stream'))).toBe(type)
  }
  expect(getAttachmentContentType(documentFile('PENAWARAN.PDF', 100, 'application/pdf'))).toBe('application/pdf')
})

test('PO attachments reject unsupported types, empty files, oversize files, MIME mismatches and long names', () => {
  for (const file of [
    documentFile('payload.exe', 100),
    documentFile('invoice.pdf.exe', 100, 'application/pdf'),
    documentFile('invoice.pdf', 0, 'application/pdf'),
    documentFile('invoice.pdf', MAX_PO_ATTACHMENT_SIZE + 1, 'application/pdf'),
    documentFile('invoice.docx', 100, 'application/pdf'),
    documentFile('x'.repeat(256) + '.pdf', 100, 'application/pdf'),
  ]) expect(() => getAttachmentContentType(file)).toThrow()
})
