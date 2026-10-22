import type { SectionStatus } from '../types/overview';

export function SectionMessage({ status }: { status: SectionStatus }) {
  const message = status === 'upgrade_required' ? 'Tersedia di paket dengan analytics.'
    : status === 'forbidden' ? 'Akses bagian ini belum diberikan.' : 'Data belum bisa dimuat. Coba perbarui dashboard.';
  return <p role={status === 'unavailable' ? 'alert' : undefined} className="py-5 text-sm text-muted-foreground">{message}</p>;
}
