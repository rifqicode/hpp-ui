import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Archive, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductInput as Input, ProductNumberInput, ProductSelect, ProductFormPanel } from './product-form-layout';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/use-auth-store';
import { usePermission } from '@/hooks/use-permission';
import { modifierService } from '../services/modifier-service';
import { recipeService } from '../services/recipe-service';
import type { ModifierGroup, ModifierGroupInput, RawMaterialStock } from '../types';
import { CurrencyText } from '@/components/ui/currency-text';

const emptyOption = () => ({ name: '', price: 0, stockId: null as string | null, quantity: 0, unit: 'pcs', isActive: true });
export function ModifierEditor({ group, onClose, onSaved }: { group?: ModifierGroup; onClose: () => void; onSaved: (id: string) => void }) {
 const [form, setForm] = useState<ModifierGroupInput>(() => group ? { ...group, options: group.options.map(o => ({ ...o })) } : { name: '', minSelection: 0, maxSelection: 1, isActive: true, options: [emptyOption()] });
 const [stocks, setStocks] = useState<RawMaterialStock[]>([]);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 useEffect(() => { let live = true; recipeService.getAvailableMaterials().then(v => { if (live) setStocks(v); }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Gagal memuat bahan'); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, []);
 const option = (index: number, changes: Partial<ModifierGroupInput['options'][number]>) => setForm(f => ({ ...f, options: f.options.map((o, i) => i === index ? { ...o, ...changes } : o) }));
 async function save(event: React.FormEvent) {
  event.preventDefault(); event.stopPropagation();
  if (saving) return;
  if (!form.name.trim() || form.options.some(o => !o.name.trim() || !Number.isFinite(o.price) || o.price < 0 || (o.stockId && (!Number.isFinite(o.quantity) || o.quantity <= 0)))) { setError('Isi nama grup dan opsi, harga nol atau lebih, serta takaran bahan lebih dari nol.'); return; }
  if (!Number.isInteger(form.minSelection) || !Number.isInteger(form.maxSelection) || form.minSelection < 0 || form.maxSelection < form.minSelection) { setError('Minimal dan maksimal pilihan harus bilangan bulat. Maksimal tidak boleh kurang dari minimal.'); return; }
  setError(''); setSaving(true);
  try { const saved = await modifierService.save(form, group?.id); onSaved(saved.id); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan grup'); } finally { setSaving(false); }
 }
 return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{group ? 'Edit grup add-on' : 'Buat grup add-on'}</DialogTitle><DialogDescription>Pilihan tambahan untuk produk yang baru dibuat setelah pesanan masuk.</DialogDescription></DialogHeader>
 <form onSubmit={save} className="space-y-4"><fieldset disabled={saving} className="min-w-0 space-y-4">
  <Label className="grid gap-2">Nama grup<Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Label>
  <div className="grid grid-cols-2 gap-3"><Label className="grid gap-2">Minimal pilihan<ProductNumberInput required value={form.minSelection} onChange={value => setForm({ ...form, minSelection: Number(value) })} /></Label><Label className="grid gap-2">Maksimal pilihan<ProductNumberInput required value={form.maxSelection} onChange={value => setForm({ ...form, maxSelection: Number(value) })} /></Label></div>
  <Label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Grup aktif</Label>
  {loading && <p role="status">Memuat bahan…</p>}
  {form.options.map((o, i) => {
    const s = o.stockId ? stocks.find(mat => mat.id === o.stockId) : undefined;
    const unitCost = s ? Number(s.avgCostPerUnit || 0) : 0;
    const portionCost = o.quantity > 0 ? o.quantity * unitCost : 0;
    const profit = o.price - portionCost;
    const isLoss = Boolean(o.stockId && portionCost > o.price);
    const marginPct = o.price > 0 ? (profit / o.price) * 100 : 0;

    return (
      <fieldset key={o.id ?? i} className="space-y-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">Opsi {i + 1}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label className="grid gap-2">Nama opsi<Input required value={o.name} onChange={e => option(i, { name: e.target.value })} /></Label>
          <Label className="grid gap-2">Harga tambahan (Rp)<ProductNumberInput aria-label="Harga tambahan (Rp)" required prefix="Rp" allowDecimal value={o.price} onChange={value => option(i, { price: Number(value) })} /></Label>
        </div>
        <Label className="grid gap-2">Bahan tambahan<ProductSelect value={o.stockId ?? ''} disabled={loading} onChange={e => { const selected = stocks.find(mat => mat.id === e.target.value); option(i, { stockId: selected?.id ?? null, unit: selected?.baseUnit ?? 'pcs', quantity: selected ? o.quantity || 1 : 0 }); }}><option value="">Tanpa konsumsi bahan</option>{stocks.map(mat => <option key={mat.id} value={mat.id}>{mat.name} ({mat.baseUnit})</option>)}</ProductSelect></Label>
        {o.stockId && <Label className="grid gap-2">Takaran per unit produk ({o.unit})<ProductNumberInput required allowDecimal maxDecimals={6} value={o.quantity} onChange={value => option(i, { quantity: Number(value) })} /></Label>}
        {o.stockId && s && (
          isLoss ? (
            <div role="alert" className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span><strong>Jual Rugi:</strong> Modal bahan (<CurrencyText value={portionCost} />) melebihi harga jual</span>
              </span>
              <span className="shrink-0 font-semibold">-<CurrencyText value={Math.abs(profit)} /></span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-border/80 bg-muted/30 p-2.5 text-xs text-muted-foreground">
              <span>Modal bahan: <strong className="text-foreground"><CurrencyText value={portionCost} /></strong> (@ <CurrencyText value={unitCost} />/{o.unit})</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Estimasi laba: <CurrencyText value={profit} /> ({marginPct.toFixed(1)}%)</span>
            </div>
          )
        )}
        <div className="flex flex-wrap items-center justify-between gap-2"><Label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={o.isActive} onChange={e => option(i, { isActive: e.target.checked })} />Opsi aktif</Label><Button type="button" variant="outline" className="h-11" onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, n) => n !== i) }))}>Hapus opsi</Button></div>
      </fieldset>
    );
  })}
  <Button type="button" variant="outline" className="h-11" onClick={() => setForm(f => ({ ...f, options: [...f.options, emptyOption()] }))}>Tambah opsi</Button>
  </fieldset>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" className="h-11" disabled={saving} onClick={onClose}>Batal</Button><Button className="h-11" disabled={saving || loading}>{saving ? 'Menyimpan...' : 'Simpan grup'}</Button></div>
 </form></DialogContent></Dialog>;
}

export function ModifierHub() {
 const storeId = useAuthStore(s => s.activeStoreId);
 const { can } = usePermission();
 const client = useQueryClient();
 const groups = useQuery({ queryKey: ['modifier-groups', storeId], queryFn: modifierService.list, enabled: Boolean(storeId) });
 const [editor, setEditor] = useState<ModifierGroup | 'new' | null>(null);
 const [archive, setArchive] = useState<ModifierGroup | null>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 async function archiveGroup() { if (!archive) return; setBusy(true); setError(''); try { await modifierService.archive(archive.id); setArchive(null); await client.invalidateQueries(); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal mengarsipkan'); } finally { setBusy(false); } }
 return <section aria-label="Add on" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Add on</h2><p className="mt-1 text-sm text-muted-foreground">Grup tambahan dapat dipakai bersama oleh produk yang baru dibuat setelah pesanan masuk.</p></div>{can('products:write') && <Button className="h-11" onClick={() => setEditor('new')}>Buat grup add-on</Button>}</div>
 {groups.isPending ? <p role="status">Memuat grup...</p> : groups.isError ? <div role="alert">{groups.error.message}<Button variant="outline" className="h-11" onClick={() => void groups.refetch()}>Coba lagi</Button></div> : groups.data.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Belum ada grup add-on. Buat grup untuk mengatur topping produk yang baru dibuat setelah pesanan masuk.</p> : <div className="grid items-start gap-4 lg:grid-cols-2">{groups.data.map(g => <ProductFormPanel key={g.id} title={`${g.name}${!g.isActive ? ' (Nonaktif)' : ''}`} description={`${g.productCount} produk memakai · Pilih ${g.minSelection}–${g.maxSelection}`}>    <ul className="divide-y text-sm">
      {g.options.map(o => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
          <div>
            <span className="font-medium">{o.name}</span>
            {!o.isActive && <span className="ml-1 text-xs text-muted-foreground">(Nonaktif)</span>}
            {o.stockId && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {o.quantity.toLocaleString('id-ID', { maximumFractionDigits: 6 })} {o.unit} per unit
              </span>
            )}
          </div>
          <span className="font-medium text-foreground">
            +<CurrencyText value={o.price} />
          </span>
        </li>
      ))}
    </ul>{can('products:write') && <div className="flex flex-wrap gap-2 border-t pt-3"><Button variant="outline" className="h-10 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary text-xs font-medium" onClick={() => setEditor(g)}><Pencil className="size-3.5 mr-1.5" />Edit grup</Button><Button variant="ghost" className="h-10 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setError(''); setArchive(g); }}><Archive className="size-3.5 mr-1.5" />Arsipkan</Button></div>}</ProductFormPanel>)}</div>}
 {editor && <ModifierEditor group={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); void client.invalidateQueries(); }} />}
 <Dialog open={Boolean(archive)} onOpenChange={open => { if (!open && !busy) setArchive(null); }}><DialogContent><DialogHeader><DialogTitle>Arsipkan {archive?.name}?</DialogTitle><DialogDescription>Grup dilepas dari produk. Pilihan pada transaksi lama tetap tersimpan.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" className="h-11" disabled={busy} onClick={() => setArchive(null)}>Batal</Button><Button variant="destructive" className="h-11" disabled={busy} onClick={() => void archiveGroup()}>{busy ? 'Mengarsipkan...' : 'Arsipkan grup'}</Button></div></DialogContent></Dialog>
 </section>;
}
