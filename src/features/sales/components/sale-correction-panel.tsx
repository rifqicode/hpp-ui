import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyText } from '@/components/ui/currency-text';
import { usePermission } from '@/hooks/use-permission';
import { salesService } from '../services/sales-service';
import type { Sale } from '../types';

export function SaleCorrectionPanel({ sale, onCorrected }: { sale: Sale; onCorrected: (sale: Sale) => void }) {
 const { can } = usePermission();
 const client = useQueryClient();
 const [open, setOpen] = useState(false);
 const [kind, setKind] = useState<'CANCEL' | 'RETURN'>('RETURN');
 const [reason, setReason] = useState('');
 const [method, setMethod] = useState('CASH');
 const [reference, setReference] = useState('');
 const [lines, setLines] = useState<Record<string, { quantity: number; restock: boolean }>>({});
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const pending = useRef<{ signature: string; id: string } | null>(null);
 const selected = sale.items.map(item => ({ sale_item_id: item.id, quantity: lines[item.id]?.quantity || 0, restock: item.productionLogId ? false : (lines[item.id]?.restock ?? true) })).filter(item => item.quantity > 0);
 const final = kind === 'CANCEL' || sale.items.every(item => (lines[item.id]?.quantity || 0) === item.quantity - (item.returnedQuantity || 0));
 const gross = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
 const selectedGross = sale.items.reduce((sum, item) => sum + (lines[item.id]?.quantity || 0) * item.priceAtSale, 0);
 const remaining = (sale.originalTotalAmount ?? sale.totalAmount) - (sale.refundedAmount || 0);
 const refund = final ? remaining : gross > 0 ? Math.min(remaining, (sale.originalTotalAmount ?? sale.totalAmount) * selectedGross / gross) : 0;
 const valid = reason.trim() && (kind === 'CANCEL' || selected.length > 0) && sale.items.every(item => {
  const qty = lines[item.id]?.quantity || 0;
  return Number.isFinite(qty) && qty >= 0 && qty <= item.quantity - (item.returnedQuantity || 0);
 });
 async function submit() {
  if (!valid || busy) return;
  setBusy(true); setError('');
  const payload = { kind, reason: reason.trim(), refund_method: method, refund_reference: reference, items: kind === 'RETURN' ? selected : [] };
  const signature = JSON.stringify(payload);
  if (pending.current?.signature !== signature) pending.current = { signature, id: crypto.randomUUID() };
  try {
   const updated = await salesService.correctSale(sale.id, { ...payload, request_id: pending.current!.id });
   onCorrected(updated); setOpen(false); setLines({}); setReason(''); pending.current = null;
   await client.invalidateQueries();
  } catch (err) { setError(err instanceof Error ? err.message : 'Koreksi gagal disimpan'); }
  finally { setBusy(false); }
 }
 return <section className="space-y-3 rounded-xl border p-3 text-sm">
  {!!sale.refundedAmount && <p>Total refund: <CurrencyText value={sale.refundedAmount} /> · Penjualan setelah koreksi: <CurrencyText value={sale.totalAmount} /></p>}
  {(sale.corrections || []).map(c => <div key={c.id} className="border-b pb-2 text-xs">
   <p className="font-semibold">{c.kind === 'CANCEL' ? 'Pembatalan' : 'Retur'} · <CurrencyText value={Number(c.refund_amount)} /></p>
   <p>{c.reason}</p><p>Dicatat oleh: {c.actor_name || c.actor_id}</p><p className="text-muted-foreground">{new Date(c.created_at).toLocaleString('id-ID')} · {c.refund_method}{c.refund_reference ? ` · ${c.refund_reference}` : ''}</p>
   {c.items.map(line => <p key={line.id}>{sale.items.find(item => item.id === line.sale_item_id)?.productName || 'Produk'}: {Number(line.quantity)} · {line.restock ? 'Kembali ke stok' : 'Tidak kembali ke stok'}</p>)}
  </div>)}
  {can('orders:void') && !['CANCELLED', 'RETURNED'].includes(sale.status) && <div className="print:hidden">
   {!open ? <Button variant="outline" onClick={() => setOpen(true)}>Koreksi transaksi</Button> : <div className="space-y-3">
    <label className="grid gap-1">Jenis koreksi<select disabled={busy} className="h-10 rounded-md border bg-background px-2" value={kind} onChange={e => setKind(e.target.value as 'CANCEL' | 'RETURN')}>
     <option value="RETURN">Retur sebagian / seluruh barang</option><option value="CANCEL">Batalkan seluruh sisa transaksi</option>
    </select></label>
    <p className="text-xs text-muted-foreground">Pembatalan produk dengan pilihan Siapkan stok dulu dapat mengembalikan barang layak jual ke hasil produksi asal. Produk dengan pilihan Buat saat dipesan yang sudah dimasak tidak kembali ke stok; bahan dan biaya produksinya tetap tercatat. Pesanan yang belum dibuat tidak menambah stok.</p>
    {kind === 'RETURN' && sale.items.map(item => <div key={item.id} className="space-y-2 rounded border p-2">
     <label className="grid gap-1">{item.productName} · maksimal {item.quantity - (item.returnedQuantity || 0)} {item.unit}
      <Input disabled={busy} aria-label={`Jumlah retur ${item.productName}`} type="number" min="0" max={item.quantity - (item.returnedQuantity || 0)} step="0.0001" value={lines[item.id]?.quantity || ''} onChange={e => setLines({ ...lines, [item.id]: { quantity: Number(e.target.value), restock: item.productionLogId ? false : (lines[item.id]?.restock ?? true) } })} />
     </label>
     <label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={busy || Boolean(item.productionLogId)} checked={item.productionLogId ? false : (lines[item.id]?.restock ?? true)} onChange={e => setLines({ ...lines, [item.id]: { quantity: lines[item.id]?.quantity || 0, restock: e.target.checked } })} />Barang layak jual, kembali ke stok</label>
    </div>)}
    <label className="grid gap-1">Alasan koreksi<Input disabled={busy} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} placeholder="Contoh: salah jumlah atau barang rusak" /></label>
    <label className="grid gap-1">Metode pengembalian uang<select disabled={busy} className="h-10 rounded-md border bg-background px-2" value={method} onChange={e => setMethod(e.target.value)}>{['CASH', 'QRIS', 'TRANSFER', 'DEBIT'].map(m => <option key={m}>{m}</option>)}</select></label>
    <label className="grid gap-1">Referensi refund (opsional)<Input disabled={busy} maxLength={200} value={reference} onChange={e => setReference(e.target.value)} /></label>
    <p>Refund: <strong><CurrencyText value={refund} /></strong></p>
    <p className="text-xs text-muted-foreground">Refund memperhitungkan diskon dan pajak secara proporsional. Pengembalian uang dilakukan manual; tombol ini mencatat refund, bukan mengirim uang.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Tutup</Button><Button disabled={!valid || busy} onClick={submit}>{busy ? 'Menyimpan…' : 'Konfirmasi koreksi & catat refund'}</Button></div>
   </div>}
  </div>}
 </section>;
}
