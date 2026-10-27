import { Link, Navigate } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CuroWordmark } from '@/components/brand/curo-logo';
import { ProductField, ProductInput, ProductNumberInput, ProductSelect } from '@/features/recipes/components/product-form-layout';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { OnboardingProductStep } from '@/features/onboarding/components/onboarding-product-step';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';
import '@/features/onboarding/styles/onboarding.css';

const STEPS = [
  { title: 'Kenali HPP', detail: 'Pahami hubungan bahan, resep, dan biaya.' },
  { title: 'Bahan baku', detail: 'Mulai dari bahan untuk satu produk.' },
  { title: 'Produk & resep', detail: 'Lengkapi varian, harga, dan resep per varian.' },
  { title: 'Hasil HPP', detail: 'Lihat biaya dan coba harga jual.' },
];
const FLOW = [
  { title: 'Bahan baku', detail: 'Harga dan satuan bahan menjadi dasar biaya.' },
  { title: 'Produk & resep', detail: 'Setiap varian memiliki harga dan resep per satu unit.' },
  { title: 'HPP produk', detail: 'Biaya per produk membantu menentukan harga jual.' },
  { title: 'Produksi', detail: 'Catat bahan yang dipakai dan hasil yang dibuat.' },
  { title: 'Penjualan', detail: 'Pantau penjualan dan laba kotor dari catatan usaha.' },
];
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(value);
const controlClass = 'h-11';

function OnboardingWizard({ storeId }: { storeId: string }) {
  const { formRef, headingRef, ...w } = useOnboarding(storeId);
  if (w.loading) return <main className="onboarding-surface grid min-h-dvh place-items-center bg-background p-6"><p role="status">Menyiapkan panduan toko Anda...</p></main>;
  if (!w.data) return <main className="onboarding-surface mx-auto max-w-lg space-y-5 p-6"><h1 className="text-2xl font-semibold">Panduan belum bisa dimuat</h1><p role="alert">{w.error}</p><Button className={controlClass} onClick={() => void w.load()}>Coba muat ulang</Button><Button asChild variant="outline" className="ml-3 h-11"><Link to="/dashboard?skipOnboarding=1">Buka dashboard</Link></Button></main>;

  return <div className="onboarding-surface min-h-dvh bg-background text-foreground">
    <a href="#onboarding-content" className="sr-only focus:not-sr-only focus:block focus:p-3">Lewati ke langkah setup</a>
    <header className="border-b"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <Link to="/dashboard" aria-label="Curo, buka dashboard" className="inline-flex min-h-11 items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><CuroWordmark className="text-2xl text-primary" /></Link>
      <Button variant="ghost" className={controlClass} disabled={w.busy} onClick={() => void w.skipOnboarding()}>Lewati</Button>
    </div></header>
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      <aside aria-label="Progres setup toko" className="min-w-0">
        <p className="text-sm font-medium text-primary">Siapkan produk pertama</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Satu resep dulu. Lengkapi usaha Anda sambil berjalan.</p>
        <ol className="mt-5 flex flex-wrap gap-2 lg:block lg:space-y-6">
          {STEPS.map((s, i) => <li key={s.title} aria-current={w.step === i + 1 ? 'step' : undefined} className="min-w-0">
            <div className="flex items-start gap-3"><span role={w.completedSteps.includes(i + 1) ? 'img' : undefined} aria-label={w.completedSteps.includes(i + 1) ? `${s.title}, selesai` : undefined} className={cn('flex size-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold', w.step === i + 1 ? 'border-primary bg-primary text-primary-foreground' : w.completedSteps.includes(i + 1) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{w.completedSteps.includes(i + 1) ? <Check className="size-4" aria-hidden="true" /> : i + 1}</span><div className={cn('min-w-0', w.step !== i + 1 && 'hidden lg:block')}><p className="text-sm font-medium leading-9">{s.title}</p><p className="hidden text-xs leading-5 text-muted-foreground lg:block">{s.detail}</p></div></div>
          </li>)}
        </ol>
      </aside>
      <main id="onboarding-content" className="min-w-0">
        <p className="text-sm text-muted-foreground">Langkah {w.step} dari {STEPS.length}</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 rounded text-2xl font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:text-3xl">{['Kenali biaya di balik produk Anda', 'Apa saja bahan produk Anda?', 'Tambah produk pertama', 'Ini biaya produk Anda'][w.step - 1]}</h1>
        {w.step === 3 ? <OnboardingProductStep controller={w} /> : <form ref={formRef} onSubmit={e => { e.preventDefault(); void w.continueStep(); }} className="mt-6 space-y-6" aria-busy={w.busy}>
          <fieldset disabled={w.busy} className="min-w-0 space-y-6">
            {w.step === 1 && <>
              <p className="max-w-prose text-sm leading-7 text-muted-foreground">HPP (Harga Pokok Produksi) adalah biaya membuat produk. Bahan, kemasan, upah, dan biaya produksi yang Anda catat membantu menghitung biaya per porsi. Dari sini, Anda bisa membandingkannya dengan harga jual.</p>
              <section aria-label="Alur kerja aplikasi" className="rounded-xl border bg-card p-4 sm:p-6"><h2 className="font-semibold">Dari bahan sampai penjualan</h2><ol className="mt-5 divide-y">{FLOW.map((item, i) => <li key={item.title} className="flex gap-4 py-3 first:pt-0 last:pb-0"><span className="w-5 shrink-0 text-sm font-semibold text-primary">{i + 1}</span><div><h3 className="text-sm font-medium">{item.title}{i > 2 && <span className="ml-2 text-xs text-muted-foreground">Setelah setup</span>}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p></div></li>)}</ol></section>
            </>}
            {w.step === 2 && <>
              <p className="text-sm leading-6 text-muted-foreground">Masukkan jumlah bahan dan harga totalnya. Harga satuan dihitung otomatis untuk acuan HPP. Bahan disimpan tanpa menambah stok atau membuat transaksi pembelian.</p>
              {w.materials.length > 0 && <p role="status" className="rounded-lg border p-4 text-sm">{w.materials.length} bahan sudah tersedia. Anda bisa langsung lanjut dan memilihnya saat membuat resep.</p>}
              {w.draft.materials.map((m, i) => <section key={m.stockId || i} aria-label={`Bahan baku ${i + 1}`} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3"><h2 className="font-medium">Bahan {i + 1}{m.stockId && <span className="ml-2 text-sm text-primary">{m.savedKey === m.key ? 'Tersimpan' : 'Perubahan belum disimpan'}</span>}</h2>{!m.stockId && <Button type="button" size="icon" variant="ghost" className="size-11 shrink-0 bg-red-600 text-white hover:bg-red-700 hover:text-white" aria-label={`Hapus bahan ${i + 1}`} title={`Hapus bahan ${i + 1}`} onClick={() => w.removeMaterial(i)}><Trash2 className="size-4" aria-hidden="true" /></Button>}</div>
                <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <ProductField id={`material-name-${i}`} label="Nama bahan"><ProductInput id={`material-name-${i}`} maxLength={150} value={m.name} onChange={e => w.updateMaterial(i, { name: e.target.value })} placeholder="Contoh: tepung terigu" /></ProductField>
                  <ProductField id={`material-unit-${i}`} label="Satuan dasar resep"><ProductSelect id={`material-unit-${i}`} disabled={Boolean(m.stockId)} value={m.baseUnit} onChange={e => w.updateMaterial(i, { baseUnit: e.target.value as 'g' | 'ml' | 'pcs' })}><option value="g">Gram (g)</option><option value="ml">Mililiter (ml)</option><option value="pcs">Buah (pcs)</option></ProductSelect></ProductField>
                  <ProductField id={`material-size-${i}`} label={`Jumlah bahan (${m.baseUnit})`}><ProductNumberInput id={`material-size-${i}`} value={m.packageQuantity} valueType="string" allowDecimal maxDecimals={6} onChange={(v: string) => w.updateMaterial(i, { packageQuantity: v })} /></ProductField>
                  <ProductField id={`material-price-${i}`} label="Harga total (Rp)" hint={w.materialUnitCosts[i] ? <span aria-live="polite" aria-atomic="true">Harga satuan: {w.materialUnitCosts[i]}</span> : undefined}><ProductNumberInput id={`material-price-${i}`} aria-describedby={w.materialUnitCosts[i] ? `material-price-${i}-hint` : undefined} value={m.price} valueType="string" allowDecimal onChange={(v: string) => w.updateMaterial(i, { price: v })} /></ProductField>
                </fieldset>
                {m.stockId && <p className="text-xs leading-5 text-muted-foreground">Anda bisa mengoreksi harga acuan di sini. Biaya batch stok tetap dipakai lebih dulu jika tersedia.</p>}
              </section>)}
              <Button type="button" className={controlClass} onClick={w.addMaterial}>Tambah bahan baku</Button>
            </>}
            {w.step === 4 && <>
              <div className="flex flex-wrap gap-2" aria-label="Pilih varian untuk melihat HPP">{w.resultVariants.map(variant => <Button key={variant.id} type="button" className="h-11" variant={w.result.variant?.id === variant.id ? 'secondary' : 'outline'} aria-pressed={w.result.variant?.id === variant.id} onClick={() => w.selectResultVariant(variant.id)}>{variant.variantName}</Button>)}</div>
              <section className="rounded-xl border bg-card p-4 sm:p-6"><h2 className="break-words text-lg font-semibold">{w.data.product?.name}</h2><p className="mt-5 text-sm text-muted-foreground">Estimasi HPP bahan per {w.result.variant?.unit}</p><p className="mt-2 break-words text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{money(w.result.cost)}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Rincian bahan untuk satu {w.result.variant?.unit}. Harga acuan dipakai saat biaya batch stok belum tersedia.</p><ul className="mt-5 divide-y border-t">{w.result.variant?.ingredients.map(i => <li key={i.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="break-words">{i.stockName} · {i.quantity.toLocaleString('id-ID', { maximumFractionDigits: 6 })} {i.baseUnit}</span><span>{money(i.subtotalCost)}</span></li>)}</ul></section>
              <dl aria-live="polite" className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:p-5"><div><dt className="text-sm text-muted-foreground">Estimasi laba kotor per {w.result.variant?.unit}</dt><dd className="mt-2 text-xl font-semibold">{money(w.result.profit)}</dd></div><div><dt className="text-sm text-muted-foreground">Margin laba kotor</dt><dd className="mt-2 text-xl font-semibold">{w.result.margin === null ? 'Isi harga jual di atas nol' : `${w.result.margin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`}</dd></div></dl>
            </>}
          </fieldset>
          {w.error && <div role="alert" className="space-y-3 rounded-lg border border-destructive p-4 text-sm"><p>{w.error}</p><Button type="button" variant="outline" className={controlClass} disabled={w.busy} onClick={() => void w.load()}>Muat ulang progres tersimpan</Button></div>}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            {w.step > 1 ? <Button type="button" variant="outline" className={controlClass} disabled={w.busy} onClick={() => void w.goBack(w.step - 1)}>Kembali</Button> : <span />}
            <Button type="submit" className="min-h-11 whitespace-normal" disabled={w.busy}>{w.busy ? 'Menyimpan...' : ['Lanjut: isi bahan baku', 'Simpan bahan & lanjut', 'Simpan produk & lihat HPP', 'Selesai & buka dashboard'][w.step - 1]}</Button>
          </footer>
          <p className="text-xs leading-5 text-muted-foreground">Tersedia di paket Free.</p>
        </form>}
      </main>
    </div>
  </div>;
}

export default function OnboardingPage() {
  const { token, activeStoreId, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!activeStoreId) return <Navigate to="/setup-store" replace />;
  if (user?.account_type === 'STAFF' || !['OWNER', 'STORE_OWNER'].includes(user?.role ?? '')) return <Navigate to="/dashboard" replace />;
  return <OnboardingWizard key={`${user?.id}:${activeStoreId}`} storeId={activeStoreId} />;
}
