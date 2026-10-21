export const MAX_PO_ATTACHMENT_SIZE = 10 * 1024 * 1024
export const MAX_PO_ATTACHMENTS = 10

export const PO_DOCUMENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export function getAttachmentContentType(file: File): string {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const contentType = PO_DOCUMENT_TYPES[extension]
  if (!contentType) throw new Error('Pilih dokumen PDF, Excel (.xls/.xlsx), atau Word (.doc/.docx).')
  if (file.size <= 0 || file.size > MAX_PO_ATTACHMENT_SIZE) {
    throw new Error('Ukuran dokumen harus lebih dari 0 dan maksimal 10MB.')
  }
  if ([...file.name].length > 255) throw new Error('Nama dokumen maksimal 255 karakter.')
  // Browsers can report an empty or generic MIME type for Office documents.
  if (file.type && file.type !== 'application/octet-stream' && file.type !== contentType) {
    throw new Error('Format dokumen tidak sesuai dengan ekstensi file.')
  }
  return contentType
}

export interface POAttachment {
  url: string
  name: string
}
