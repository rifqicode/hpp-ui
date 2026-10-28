import type { ServiceAgreementDocument } from '@/features/auth/types'

export const agreementDocument: ServiceAgreementDocument = {
  version: 'server-document-v7',
  title: 'Ketentuan Layanan & Kebijakan Privasi',
  app_name: 'Ekatra POS',
  sections: Array.from({ length: 12 }, (_, index) => ({
    title: `${index + 1}. Bagian dokumen dari server`,
    paragraphs: Array.from({ length: 3 }, () => 'Ini adalah isi dokumen uji yang diterima dari backend. Pengguna perlu membaca ketentuan yang berlaku sebelum menyetujui penggunaan layanan.'),
  })),
  closing_text: 'Akhir dokumen uji. Klik Selesai membaca dan setuju jika Anda menyetujuinya.',
}
