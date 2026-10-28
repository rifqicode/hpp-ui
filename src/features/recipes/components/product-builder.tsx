import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Check, Plus, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyText } from '@/components/ui/currency-text';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploadDropzone } from './image-upload-dropzone';
import { ModifierEditor } from './modifier-hub';
import { ProductField, ProductFormPanel, ProductInput, ProductNumberInput, ProductPageHeader, ProductSelect } from './product-form-layout';
import { recipeService, productInput } from '../services/recipe-service';
import { getRecipeEstimate, getSuggestedSellingPrice, isTargetMarginValid, newProductForm, newVariant } from '../lib/product-form';
import { modifierService } from '../services/modifier-service';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';
import type { Product, VariantInput, CreateProductInput, ModifierGroup } from '../types';

const TARGET_MARGIN_ERROR = 'Margin harus antara 0% dan kurang dari 100%.';

function PriceAmount({ value }: { value: number }) {
  const decimals = Math.min(4, String(value).split('.')[1]?.length ?? 0);
  return <CurrencyText value={value} allowDecimal={decimals > 0} decimalDigits={decimals} />;
}

function readDraft(key: string, fallback: CreateProductInput): CreateProductInput {
  try {
    const draft: CreateProductInput = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!draft || typeof draft.name !== 'string' || typeof draft.category !== 'string'
      || !['MAKE_TO_ORDER', 'MAKE_TO_STOCK'].includes(draft.mode) || !Array.isArray(draft.variants) || !draft.variants.length
      || !Array.isArray(draft.modifierGroupIds) || !draft.modifierGroupIds.every(id => typeof id === 'string')) return fallback;
    const valid = draft.variants.every(v => v && typeof v.variantName === 'string' && typeof v.sku === 'string' && typeof v.unit === 'string'
      && [v.sellingPrice, v.targetMargin, v.minStock].every(Number.isFinite) && typeof v.isActive === 'boolean' && typeof v.isDefault === 'boolean'
      && Array.isArray(v.ingredients) && v.ingredients.every(i => i && typeof i.stockId === 'string' && Number.isFinite(i.quantity)));
    return valid ? draft : fallback;
  } catch { return fallback; }
}

interface Validation { step: number; variant?: number; errors: Record<string, string> }

export function ProductBuilder({ product, onSaved, onCancel, initialStep = 0, initialVariantId, initialVariantIndex = 0, startWithNewVariant = false, initialPricingOpen = false, value, onChange, saveProduct, embedded = false, externalBusy = false, onStepChange, onAddMaterial }: {
  product?: Product; onSaved?: (product: Product) => void; onCancel?: () => void; initialStep?: number; initialVariantId?: string;
  initialVariantIndex?: number; startWithNewVariant?: boolean; initialPricingOpen?: boolean; value?: CreateProductInput; onChange?: Dispatch<SetStateAction<CreateProductInput>>;
  saveProduct?: (input: CreateProductInput) => Promise<Product>; embedded?: boolean; externalBusy?: boolean;
  onStepChange?: (step: number) => void; onAddMaterial?: (variantIndex: number) => void;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const storeId = useAuthStore(s => s.activeStoreId);
  const userId = useAuthStore(s => s.user?.id);
  const draftKey = `product-create-draft:v1:${userId}:${storeId}`;
  const materials = useQuery({ queryKey: ['recipe-materials', storeId], queryFn: recipeService.getAvailableMaterials, enabled: Boolean(storeId) });
  const categories = useQuery({ queryKey: ['products', 'categories', storeId], queryFn: recipeService.getCategories, enabled: Boolean(storeId) });
  const groups = useQuery({ queryKey: ['modifier-groups', storeId], queryFn: modifierService.list, enabled: Boolean(storeId) });
  const [baseline] = useState<CreateProductInput>(() => product ? productInput(product) : newProductForm());
  const [internalForm, setInternalForm] = useState(() => {
    if (value) return value;
    if (!product) return readDraft(draftKey, baseline);
    if (!startWithNewVariant) return baseline;
    return { ...baseline, variants: [...baseline.variants, {
      ...newVariant(`Varian ${baseline.variants.length + 1}`),
      isDefault: baseline.variants.length === 0,
    }] };
  });
  const form = value ?? internalForm;
  const setForm = onChange ?? setInternalForm;
  const [restored] = useState(() => !product && JSON.stringify(form) !== JSON.stringify(baseline));
  const [step, setStep] = useState(initialStep);
  const [visited, setVisited] = useState(initialStep);
  const [selected, setSelected] = useState(() => startWithNewVariant && product && !value
    ? form.variants.length - 1
    : Math.max(0, Math.min(form.variants.length - 1, initialVariantId && product ? product.variants.findIndex(v => v.id === initialVariantId) : initialVariantIndex)));
  const [marginInput, setMarginInput] = useState<{ variant: number; targetMargin: number; text: string } | null>(null);
  const [showCalculator, setShowCalculator] = useState(initialPricingOpen);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusTarget, setFocusTarget] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [showCategory, setShowCategory] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | 'new' | null>(null);
  const [copySource, setCopySource] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const savedRef = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const variant = form.variants[selected];
  const validMargin = isTargetMarginValid(variant.targetMargin);
  const marginError = errors[`variant-margin-${selected}`] || (!validMargin ? TARGET_MARGIN_ERROR : undefined);
  const marginText = marginInput?.variant === selected && marginInput.targetMargin === variant.targetMargin
    ? marginInput.text : variant.targetMargin === 0 ? '' : String(Number((variant.targetMargin * 100).toFixed(2)));
  const steps = form.mode === 'MAKE_TO_ORDER' && !initialPricingOpen ? ['Info dasar', 'Varian & bahan baku', 'Add-on & topping'] : ['Info dasar', 'Varian & bahan baku'];
  const finalStep = step === steps.length - 1;
  const estimate = getRecipeEstimate(variant, materials.data);
  const suggestedPrice = getSuggestedSellingPrice(variant, materials.data);
  const savedVariant = product?.variants.find(item => item.id === variant.id);
  const priceDifference = estimate !== null ? variant.sellingPrice - estimate : null;

  useEffect(() => {
    if (startWithNewVariant && product) document.getElementById(`variant-name-${product.variants.length}`)?.focus();
  }, [startWithNewVariant, product]);

  useEffect(() => {
    if (product || value || savedRef.current) return;
    try {
      if (dirty) sessionStorage.setItem(draftKey, JSON.stringify(form));
      else sessionStorage.removeItem(draftKey);
    } catch { /* Storage can be unavailable in private browser sessions. */ }
  }, [draftKey, form, dirty, product, value]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (!savedRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!focusTarget || !errors[focusTarget]) return;
    const field = document.getElementById(focusTarget);
    const details = field?.closest('details');
    if (details) details.open = true;
    field?.focus();
    field?.scrollIntoView?.({ block: 'center' });
  }, [focusTarget, step, selected, errors]);

  function goTo(next: number) {
    setError(''); setErrors({}); setFocusTarget(''); setStep(next);
    onStepChange?.(next);
    topRef.current?.scrollIntoView?.({ block: 'start' });
  }
  function leave() { if (onCancel) onCancel(); else navigate('/production/products'); }
  function cancel() { if (dirty && !embedded) setConfirmLeave(true); else leave(); }
  function updateVariant(changes: Partial<VariantInput>) {
    setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === selected ? { ...v, ...changes } : v) }));
  }
  function updateMargin(text: string) {
    const targetMargin = Number(text) / 100;
    setMarginInput({ variant: selected, targetMargin, text });
    updateVariant({ targetMargin });
    setErrors(current => { const next = { ...current }; delete next[`variant-margin-${selected}`]; return next; });
    setError(current => current === TARGET_MARGIN_ERROR ? '' : current);
  }
  function fieldState(id: string) {
    return { 'aria-invalid': Boolean(errors[id]), 'aria-describedby': errors[id] ? `${id}-error` : undefined };
  }
  function validate(which: number): Validation | null {
    if (which === 0 && !form.name.trim()) return { step: 0, errors: { 'product-name': 'Nama produk wajib diisi.' } };
    if (which !== 1) return null;
    for (let i = 0; i < form.variants.length; i++) {
      const v = form.variants[i];
      const fields: Record<string, string> = {};
      if (!v.variantName.trim()) fields[`variant-name-${i}`] = 'Nama varian wajib diisi.';
      if (!v.unit.trim()) fields[`variant-unit-${i}`] = 'Satuan hasil wajib diisi.';
      if (!Number.isFinite(v.sellingPrice) || v.sellingPrice < 0) fields[`variant-price-${i}`] = 'Harga jual harus nol atau lebih.';
      if (!isTargetMarginValid(v.targetMargin)) fields[`variant-margin-${i}`] = TARGET_MARGIN_ERROR;
      if (!Number.isFinite(v.minStock) || v.minStock < 0) fields[`variant-stock-${i}`] = 'Minimum stok harus nol atau lebih.';
      if (v.sku && form.variants.some((other, n) => n !== i && other.sku.trim().toLowerCase() === v.sku.trim().toLowerCase())) fields[`variant-sku-${i}`] = 'SKU antarvarian harus berbeda.';
      if (v.isActive && v.ingredients.length === 0) fields[`ingredients-${i}`] = 'Isi minimal satu bahan pada setiap varian aktif.';
      v.ingredients.forEach((line, n) => {
        if (!line.stockId) fields[`material-${i}-${n}`] = 'Pilih bahan baku.';
        else if (v.ingredients.some((other, m) => m !== n && other.stockId === line.stockId)) fields[`material-${i}-${n}`] = 'Bahan ini sudah digunakan. Gabungkan takarannya.';
        if (!Number.isFinite(line.quantity) || !(line.quantity > 0)) fields[`quantity-${i}-${n}`] = 'Takaran harus lebih dari nol.';
      });
      if (Object.keys(fields).length) return { step: 1, variant: i, errors: fields };
    }
    if (form.variants.filter(v => v.isActive && v.isDefault).length !== 1) return { step: 1, variant: 0, errors: { 'variant-default-0': 'Tentukan tepat satu varian default yang aktif.' } };
    return null;
  }
  function showValidation(result: Validation) {
    if (Object.keys(result.errors).some(key => key.startsWith('variant-margin-'))) setShowCalculator(true);
    setStep(result.step);
    onStepChange?.(result.step);
    if (result.variant !== undefined) setSelected(result.variant);
    setErrors(result.errors); setError(Object.values(result.errors)[0]); setFocusTarget(Object.keys(result.errors)[0]);
  }
  function next() {
    const result = validate(step);
    if (result) { showValidation(result); return; }
    setVisited(Math.max(visited, step + 1)); goTo(step + 1);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!finalStep) { next(); return; }
    for (const n of [0, 1]) { const result = validate(n); if (result) { showValidation(result); return; } }
    setError(''); setErrors({}); setSaving(true);
    try {
      const payload = { ...form, modifierGroupIds: form.mode === 'MAKE_TO_ORDER' ? form.modifierGroupIds : [] };
      const saved = saveProduct ? await saveProduct(payload) : product ? await recipeService.updateProduct(product.id, payload) : await recipeService.createProduct(payload);
      savedRef.current = true;
      if (!product && !value) { try { sessionStorage.removeItem(draftKey); } catch { /* A storage failure must not prevent completing a saved product. */ } }
      await client.invalidateQueries();
      if (onSaved) onSaved(saved); else if (!embedded) navigate(`/production/products/${saved.id}`, { replace: true });
    } catch (e) { savedRef.current = false; setError(e instanceof Error ? e.message : 'Gagal menyimpan produk. Isian tetap tersimpan di form.'); } finally { setSaving(false); }
  }
  async function addCategory() {
    if (!categoryName.trim() || categoryBusy) return;
    setCategoryBusy(true); setCategoryError('');
    try {
      const category = await recipeService.createCategory(categoryName.trim());
      setForm(f => ({ ...f, categoryId: category.id, category: category.name }));
      setCategoryName(''); setShowCategory(false); await categories.refetch();
    } catch (e) { setCategoryError(e instanceof Error ? e.message : 'Gagal membuat kategori.'); } finally { setCategoryBusy(false); }
  }
  function copyRecipe(source: number) {
    updateVariant({ ingredients: form.variants[source].ingredients.map(line => ({ ...line })) });
    setCopySource(null);
  }

  const estimateContent = <>
    <div aria-live="polite"><p className="text-sm text-muted-foreground">Biaya bahan per {variant.unit || 'unit'}</p><p className="mt-1 text-xl font-semibold tabular-nums">{estimate === null ? 'Belum dihitung' : <CurrencyText value={estimate} />}</p></div>
    <dl className="space-y-3 text-sm">
      {savedVariant && savedVariant.latestHpp > 0 && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Biaya produksi terakhir</dt><dd><PriceAmount value={savedVariant.latestHpp} /></dd></div>}
      {savedVariant && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Harga jual tersimpan</dt><dd><PriceAmount value={savedVariant.sellingPrice} /></dd></div>}
      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{savedVariant ? 'Harga yang akan disimpan' : 'Harga jual'}</dt><dd><PriceAmount value={variant.sellingPrice} /></dd></div>
      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Selisih dari biaya bahan</dt><dd className={cn(priceDifference !== null && priceDifference < 0 && 'text-red-700 dark:text-red-300')}>{priceDifference === null ? 'Belum tersedia' : <PriceAmount value={priceDifference} />}</dd></div>
    </dl>
    <p className="text-xs leading-5 text-muted-foreground">Perkiraan berdasarkan biaya bahan saat ini. Belum termasuk bahan terbuang, upah, listrik, dan biaya operasional lainnya.</p>
  </>;

  return <div ref={topRef} className="w-full min-w-0 space-y-5 pb-8">
    {!embedded && <ProductPageHeader title={product ? `${initialPricingOpen ? 'Tinjau harga' : startWithNewVariant ? 'Tambah varian' : 'Edit'} ${product.name}` : 'Tambah Produk'} description={initialPricingOpen ? 'Bandingkan biaya bahan terbaru dengan harga tersimpan. Harga baru dipakai setelah kamu menyimpannya.' : startWithNewVariant ? 'Isi nama varian, lalu tambahkan bahan dan takaran untuk menghitung harga jualnya.' : 'Atur informasi produk, lalu lengkapi varian dan bahan baku per satu unit.'} backTo="/production/products" onBack={cancel} />}
    {restored && <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">Draft produk dipulihkan. Isian baru disimpan ke katalog setelah Anda memilih Simpan produk.</p>}
    <form onSubmit={save} noValidate className="space-y-4">
      <ol aria-label="Tahapan produk" className="flex flex-wrap gap-x-4 gap-y-2 border-b pb-4">
        {steps.map((label, i) => <li key={label}><button type="button" aria-current={step === i ? 'step' : undefined} disabled={saving || externalBusy || i > visited} onClick={() => {
          if (i > step) { const result = validate(step); if (result) { showValidation(result); return; } }
          goTo(i);
        }} className={cn('flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', step === i ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground')}>
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full border text-xs', step === i && 'border-primary bg-primary text-primary-foreground')}>{i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}</span>{label}
        </button></li>)}
      </ol>
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-red-700 dark:text-red-300"><p className="font-semibold">{Object.keys(errors).length ? 'Periksa isian sebelum melanjutkan' : 'Produk belum tersimpan'}</p><p className="mt-1">{error}</p></div>}
      <fieldset disabled={saving || externalBusy} className="min-w-0 space-y-4">
        {step === 0 && <div className={cn('grid items-start gap-4', embedded ? 'xl:grid-cols-[minmax(0,1fr)_16rem]' : 'lg:grid-cols-[minmax(0,1fr)_19rem]')}>
          <ProductFormPanel title="Info dasar" description="Atur nama produk dan cara menyiapkannya.">
            <ProductField id="product-name" label="Nama produk" required error={errors['product-name']}><ProductInput id="product-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Caffe Latte" {...fieldState('product-name')} /></ProductField>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><ProductField id="product-category" label="Kategori" optional><ProductSelect id="product-category" value={form.categoryId ?? ''} disabled={categories.isPending} onChange={e => { const c = categories.data?.find(c => c.id === e.target.value); setForm({ ...form, categoryId: c?.id, category: c?.name ?? '' }); }}><option value="">{categories.isPending ? 'Memuat kategori...' : 'Tanpa kategori'}</option>{categories.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ProductSelect></ProductField><Button type="button" variant="ghost" className="h-11 text-primary dark:text-indigo-300" aria-expanded={showCategory} onClick={() => setShowCategory(!showCategory)}><Plus className="size-4" aria-hidden />Buat kategori</Button></div>
              <ProductField id="product-mode" label="Cara menyiapkan produk" hint={form.mode === 'MAKE_TO_ORDER' ? 'Produk baru dibuat setelah ada pesanan, seperti kopi atau makanan restoran.' : 'Produk dibuat lebih dulu. Penjualan mengurangi stok yang tersedia.'}><ProductSelect id="product-mode" aria-describedby="product-mode-hint" value={form.mode} onChange={e => { setForm({ ...form, mode: e.target.value as Product['mode'] }); setVisited(0); }}><option value="MAKE_TO_STOCK">Siapkan stok dulu</option><option value="MAKE_TO_ORDER">Buat saat dipesan</option></ProductSelect></ProductField>
            </div>
            {categories.isError && <div role="alert" className="text-sm">Gagal memuat kategori. <Button type="button" variant="outline" onClick={() => void categories.refetch()}>Coba lagi</Button></div>}
            {showCategory && <div className="space-y-2 rounded-lg border bg-muted/30 p-3"><ProductField id="new-category" label="Nama kategori baru"><ProductInput id="new-category" value={categoryName} onChange={e => setCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void addCategory(); } }} /></ProductField><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="h-11" disabled={categoryBusy || !categoryName.trim()} onClick={() => void addCategory()}>{categoryBusy ? 'Menambah...' : 'Tambah kategori'}</Button><Button type="button" variant="ghost" className="h-11" onClick={() => setShowCategory(false)}>Tutup</Button></div>{categoryError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{categoryError}</p>}</div>}
            <ProductField id="product-description" label="Deskripsi" optional><Textarea id="product-description" rows={3} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} /></ProductField>
          </ProductFormPanel>
          <ProductFormPanel title="Foto produk" description="Opsional. Membantu tim mengenali produk di katalog dan kasir."><ImageUploadDropzone value={form.imageUrl} onChange={imageUrl => setForm(f => ({ ...f, imageUrl }))} disabled={saving} /></ProductFormPanel>
        </div>}

        {step === 1 && <section aria-label="Varian dan bahan baku" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2" aria-label="Pilih varian">{form.variants.map((v, i) => <Button key={v.id ?? i} type="button" className="h-11" aria-pressed={selected === i} variant={selected === i ? 'secondary' : 'outline'} onClick={() => { setSelected(i); setErrors({}); setError(''); }}>{v.variantName || `Varian ${i + 1}`}{!v.isActive && ' (Arsip)'}</Button>)}<Button type="button" variant={embedded ? 'default' : 'outline'} className="h-11" onClick={() => { setForm(f => ({ ...f, variants: [...f.variants, newVariant(`Varian ${f.variants.length + 1}`)] })); setSelected(form.variants.length); setErrors({}); setError(''); }}><Plus className="size-4" aria-hidden />Tambah varian</Button></div>
          <div className={cn('grid items-start gap-4', embedded ? 'xl:grid-cols-[minmax(0,1fr)_16rem]' : 'lg:grid-cols-[minmax(0,1fr)_19rem]')}>
            <div className="min-w-0 space-y-4">
              <ProductFormPanel title="Identitas varian" description="Setiap varian mempunyai harga, bahan baku dan stok sendiri.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProductField id={`variant-name-${selected}`} label="Nama varian" required error={errors[`variant-name-${selected}`]}><ProductInput id={`variant-name-${selected}`} value={variant.variantName} onChange={e => updateVariant({ variantName: e.target.value })} {...fieldState(`variant-name-${selected}`)} /></ProductField>
                  <ProductField id={`variant-unit-${selected}`} label="Satuan hasil" required error={errors[`variant-unit-${selected}`]} hint={embedded ? 'Satuan untuk satu produk varian ini, misalnya pcs, cup, atau botol.' : undefined}><ProductInput id={`variant-unit-${selected}`} value={variant.unit} placeholder="Contoh: pcs, cup, botol" onChange={e => updateVariant({ unit: e.target.value })} {...fieldState(`variant-unit-${selected}`)} /></ProductField>
                </div>
                <details className="rounded-lg border p-3"><summary className="cursor-pointer rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">SKU & status varian</summary><div className="mt-4 space-y-3">
                  <ProductField id={`variant-sku-${selected}`} label="SKU (otomatis jika kosong)" error={errors[`variant-sku-${selected}`]}><ProductInput id={`variant-sku-${selected}`} value={variant.sku} onChange={e => updateVariant({ sku: e.target.value })} {...fieldState(`variant-sku-${selected}`)} /></ProductField>
                  <div className="flex flex-wrap gap-4"><Label className="flex min-h-11 items-center gap-2"><input id={`variant-default-${selected}`} type="radio" className="size-4 accent-primary" name="default-variant" checked={variant.isDefault} onChange={() => setForm(f => ({ ...f, variants: f.variants.map((v, i) => ({ ...v, isDefault: i === selected, isActive: i === selected ? true : v.isActive })) }))} />Varian default</Label><Label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={variant.isActive} disabled={variant.isDefault} onChange={e => updateVariant({ isActive: e.target.checked })} />Varian aktif</Label></div>
                  {!variant.id && form.variants.length > 1 && <Button type="button" variant="outline" className="h-11" onClick={() => { setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== selected) })); setSelected(0); }}>Hapus varian baru</Button>}
                </div></details>
              </ProductFormPanel>
              <ProductFormPanel title={`Bahan baku per satu ${variant.unit || 'unit'}`} description="Isi takaran untuk satu unit hasil. Hasil aktual dan produk rusak dicatat saat produksi.">
                {form.variants.length > 1 && <ProductField id="copy-recipe" label="Salin bahan baku dari varian lain"><ProductSelect id="copy-recipe" value="" onChange={e => { const source = Number(e.target.value); if (variant.ingredients.length) setCopySource(source); else copyRecipe(source); }}><option value="" disabled>Pilih sumber bahan baku</option>{form.variants.map((v, i) => i !== selected && <option key={v.id ?? i} value={i}>{v.variantName}</option>)}</ProductSelect></ProductField>}
                {materials.isPending ? <p role="status">Memuat bahan...</p> : materials.isError ? <div role="alert"><p>Gagal memuat bahan baku.</p><Button type="button" variant="outline" className="mt-2 h-11" onClick={() => void materials.refetch()}>Muat ulang bahan</Button></div> : <>
                  {variant.ingredients.map((line, index) => <div key={index} className="grid items-start gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
                    <ProductField id={`material-${selected}-${index}`} label={`Bahan ${index + 1}`} required error={errors[`material-${selected}-${index}`]}><ProductSelect id={`material-${selected}-${index}`} value={line.stockId} {...fieldState(`material-${selected}-${index}`)} onChange={e => { const stock = materials.data.find(s => s.id === e.target.value); updateVariant({ ingredients: variant.ingredients.map((i, n) => n === index ? { ...i, stockId: e.target.value, unit: stock?.baseUnit } : i) }); }}><option value="">Pilih bahan</option>{materials.data.map(s => <option key={s.id} value={s.id}>{s.name} ({s.baseUnit})</option>)}</ProductSelect></ProductField>
                    <ProductField id={`quantity-${selected}-${index}`} label={`Takaran (${line.unit || 'unit'})`} required error={errors[`quantity-${selected}-${index}`]}><ProductNumberInput id={`quantity-${selected}-${index}`} allowDecimal maxDecimals={6} value={line.quantity} onChange={value => updateVariant({ ingredients: variant.ingredients.map((i, n) => n === index ? { ...i, quantity: Number(value) } : i) })} {...fieldState(`quantity-${selected}-${index}`)} /></ProductField>
                    <Button type="button" size={embedded ? 'icon' : 'default'} variant="ghost" className={cn('h-11 sm:mt-7', embedded && 'size-11 shrink-0 bg-red-600 text-white hover:bg-red-700 hover:text-white')} aria-label={`Hapus bahan ${index + 1}`} title={embedded ? `Hapus bahan ${index + 1}` : undefined} onClick={() => updateVariant({ ingredients: variant.ingredients.filter((_, n) => n !== index) })}>{embedded ? <Trash2 className="size-4" aria-hidden /> : 'Hapus'}</Button>
                  </div>)}
                  {variant.ingredients.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada bahan untuk varian ini. Tambahkan bahan untuk menghitung estimasi biaya.</p>}
                  <div id={`ingredients-${selected}`} tabIndex={-1} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex flex-wrap gap-2"><Button type="button" variant={embedded ? 'default' : 'outline'} className="h-11" onClick={() => updateVariant({ ingredients: [...variant.ingredients, { stockId: '', quantity: 1, unit: '' }] })}><Plus className="size-4" aria-hidden />Tambah bahan</Button>{onAddMaterial && <Button type="button" className="h-11" onClick={() => onAddMaterial(selected)}>Tambah bahan yang belum ada</Button>}</div>{errors[`ingredients-${selected}`] && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{errors[`ingredients-${selected}`]}</p>}</div>
                </>}
              </ProductFormPanel>
              <ProductFormPanel title="Harga & stok" description="Harga berlaku untuk varian yang sedang dipilih.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProductField id={`variant-price-${selected}`} label="Harga jual (Rp)" error={errors[`variant-price-${selected}`]} hint="Isi harga yang ingin dipakai. Perubahan biaya bahan tidak mengubah harga ini otomatis."><ProductNumberInput id={`variant-price-${selected}`} prefix="Rp" allowDecimal maxDecimals={4} value={variant.sellingPrice} onChange={value => {
                    updateVariant({ sellingPrice: Number(value) });
                    setErrors(current => { const next = { ...current }; delete next[`variant-price-${selected}`]; return next; });
                  }} aria-describedby={`variant-price-${selected}-${errors[`variant-price-${selected}`] ? 'error' : 'hint'}`} aria-invalid={Boolean(errors[`variant-price-${selected}`])} /></ProductField>
                  {form.mode === 'MAKE_TO_STOCK' && <ProductField id={`variant-stock-${selected}`} label="Minimum stok" error={errors[`variant-stock-${selected}`]} hint="Produk ditandai menipis saat stok mencapai batas ini."><ProductNumberInput id={`variant-stock-${selected}`} allowDecimal value={variant.minStock} onChange={value => updateVariant({ minStock: Number(value) })} {...fieldState(`variant-stock-${selected}`)} /></ProductField>}
                </div>
                {estimate !== null && variant.sellingPrice < estimate && <FeedbackAlert>Harga jual saat ini lebih rendah dari perkiraan biaya bahan. Kamu bisa meninjau perhitungan di bawah sebelum menyimpan.</FeedbackAlert>}
                <Button type="button" variant="outline" className="min-h-11 gap-2" aria-expanded={showCalculator} aria-controls="product-price-calculator" onClick={() => setShowCalculator(!showCalculator)}><Calculator className="size-4" aria-hidden="true" />Bantu tentukan harga</Button>
                <div id="product-price-calculator" hidden={!showCalculator} className="space-y-4 rounded-lg border bg-muted p-4">
                  <ProductField id={`variant-margin-${selected}`} label="Margin (%)" error={marginError} hint="Dihitung dari harga jual: Modal ÷ (1 - Margin). Contoh: Margin 50% berarti modal adalah 50% dari harga jual."><ProductNumberInput id={`variant-margin-${selected}`} suffix="%" allowDecimal maxDecimals={2} valueType="string" value={marginText} placeholder="0" onChange={(text: string) => updateMargin(text)} aria-invalid={Boolean(marginError)} aria-describedby={`variant-margin-${selected}-${marginError ? 'error' : 'hint'}`} /></ProductField>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div aria-live="polite"><p className="text-sm text-muted-foreground">Saran harga jual</p><p className="mt-1 text-xl font-semibold tabular-nums">{suggestedPrice === null ? 'Lengkapi bahan dan takaran dulu' : <PriceAmount value={suggestedPrice} />}</p></div>
                    <Button type="button" className="min-h-11 px-4" disabled={suggestedPrice === null || suggestedPrice === variant.sellingPrice} onClick={() => {
                      if (suggestedPrice === null) return;
                      updateVariant({ sellingPrice: suggestedPrice });
                      setErrors(current => { const next = { ...current }; delete next[`variant-price-${selected}`]; return next; });
                    }}>Pakai hasil perhitungan</Button>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">Saran ini belum termasuk upah dan biaya operasional. Harga hanya berubah jika kamu memakai hasil perhitungan atau mengisi harga sendiri.</p>
                </div>
                <div className={cn('space-y-3 rounded-lg bg-muted/40 p-3', embedded ? 'xl:hidden' : 'lg:hidden')}>{estimateContent}</div>
              </ProductFormPanel>
            </div>
            <aside className={cn('hidden min-w-0', embedded ? 'xl:sticky xl:top-4 xl:block' : 'lg:sticky lg:top-4 lg:block')} aria-label="Estimasi varian"><ProductFormPanel title="Estimasi biaya" description={variant.variantName}>{estimateContent}</ProductFormPanel></aside>
          </div>
        </section>}

        {step === 2 && form.mode === 'MAKE_TO_ORDER' && <ProductFormPanel title="Add-on & Topping" description="Opsional. Pilih grup tambahan yang dapat dipesan untuk produk ini.">
          {groups.isPending ? <p role="status">Memuat grup...</p> : groups.isError ? <div role="alert"><p>Gagal memuat grup add-on.</p><Button type="button" variant="outline" className="mt-2 h-11" onClick={() => void groups.refetch()}>Coba lagi</Button></div> : <div className="grid gap-3 sm:grid-cols-2">{groups.data.filter(g => g.isActive).map(g => (
            <div key={g.id} className="flex min-h-11 items-start justify-between gap-3 rounded-lg border p-4">
              <Label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input className="mt-1 size-4 shrink-0 accent-primary" type="checkbox" checked={form.modifierGroupIds?.includes(g.id) ?? false} onChange={e => setForm(f => ({ ...f, modifierGroupIds: e.target.checked ? [...(f.modifierGroupIds ?? []), g.id] : f.modifierGroupIds?.filter(id => id !== g.id) }))} />
                <span className="min-w-0 leading-5">{g.name}<span className="mt-1 block text-xs font-normal text-muted-foreground">Pilih {g.minSelection}–{g.maxSelection}: {g.options.filter(o => o.isActive).map(o => o.name).join(', ')}</span></span>
              </Label>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground" aria-label={`Edit ${g.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingGroup(g); }}>Edit</Button>
            </div>
          ))}{groups.data.filter(g => g.isActive).length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">Belum ada grup aktif. Produk dapat disimpan tanpa add-on.</p>}</div>}
          <Button type="button" variant="outline" className="h-11" onClick={() => setEditingGroup('new')}><Plus className="size-4" aria-hidden />Buat grup add-on baru</Button>
        </ProductFormPanel>}

        {finalStep && <ProductFormPanel title="Periksa sebelum menyimpan" description={`${form.name || 'Produk tanpa nama'} · ${form.category || 'Tanpa kategori'} · ${form.mode === 'MAKE_TO_ORDER' ? 'Buat saat dipesan' : 'Siapkan stok dulu'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm">
            <div className="min-w-0">
              <p className="break-words font-medium">{form.name || 'Produk tanpa nama'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{form.category || 'Tanpa kategori'} · {form.mode === 'MAKE_TO_ORDER' ? 'Buat saat dipesan' : 'Siapkan stok dulu'}</p>
            </div>
            <Button type="button" variant="ghost" className="h-11" aria-label="Ubah info dasar" onClick={() => goTo(0)}>Ubah</Button>
          </div>
          <ul className="divide-y">{form.variants.map((v, i) => <li key={v.id ?? i} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="break-words text-sm font-medium">{v.variantName || `Varian ${i + 1}`}{v.isDefault && ' · Default'}{!v.isActive && ' · Arsip'}</p><p className="mt-1 text-xs text-muted-foreground">{isTargetMarginValid(v.targetMargin) ? <CurrencyText value={v.sellingPrice} /> : 'Tidak dapat dihitung'} / {v.unit || 'unit'} · {v.ingredients.length} bahan{v.isActive && !v.ingredients.length && ' · Bahan baku belum lengkap'}</p></div><Button type="button" variant="ghost" className="h-11" aria-label={`Ubah varian ${v.variantName || i + 1}`} onClick={() => { setSelected(i); goTo(1); }}>Ubah</Button></li>)}</ul>
          {form.mode === 'MAKE_TO_ORDER' && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
              <p className="min-w-0 text-muted-foreground">Add-on: {form.modifierGroupIds?.length ? groups.data?.filter(g => form.modifierGroupIds?.includes(g.id)).map(g => g.name).join(', ') || `${form.modifierGroupIds.length} grup` : 'Tanpa add-on'}</p>
              <Button type="button" variant="ghost" className="h-11" aria-label="Ubah add-on" onClick={() => goTo(2)}>Ubah</Button>
            </div>
          )}
        </ProductFormPanel>}
      </fieldset>

      <div className="z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:p-4 lg:sticky lg:bottom-0"><p className="text-xs text-muted-foreground">Langkah {step + 1} dari {steps.length}{dirty && ' · Belum disimpan ke katalog'}</p><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button type="button" variant="ghost" className="h-11 flex-1 sm:flex-none" disabled={saving || externalBusy} onClick={cancel}>{embedded ? 'Kembali ke bahan baku' : 'Batal'}</Button>{step > 0 && <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none" disabled={saving || externalBusy} onClick={() => goTo(step - 1)}>Kembali</Button>}{!finalStep ? <Button key="next-step" type="button" className="h-11 flex-1 sm:flex-none" disabled={saving || externalBusy} onClick={next}>Lanjut</Button> : <Button key="save-product" type="submit" className="h-11 flex-1 sm:flex-none" disabled={saving || externalBusy || materials.isPending || materials.isError || (!initialPricingOpen && form.mode === 'MAKE_TO_ORDER' && (groups.isPending || groups.isError))}>{saving ? 'Menyimpan...' : initialPricingOpen ? 'Simpan harga baru' : 'Simpan produk'}</Button>}</div></div>
    </form>
    {editingGroup && (
      <ModifierEditor
        group={editingGroup === 'new' ? undefined : editingGroup}
        onClose={() => setEditingGroup(null)}
        onSaved={id => {
          setEditingGroup(null);
          if (editingGroup === 'new') {
            setForm(f => ({ ...f, modifierGroupIds: [...(f.modifierGroupIds ?? []), id] }));
          }
          void groups.refetch();
        }}
      />
    )}
    <Dialog open={copySource !== null} onOpenChange={open => { if (!open) setCopySource(null); }}><DialogContent><DialogHeader><DialogTitle>Ganti bahan baku {variant.variantName}?</DialogTitle><DialogDescription>Bahan yang sudah diisi akan diganti dengan salinan bahan baku {copySource !== null ? form.variants[copySource]?.variantName : ''}. Bahan baku sumber tetap tersimpan.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button type="button" variant="outline" className="h-11" onClick={() => setCopySource(null)}>Batal</Button><Button type="button" className="h-11" onClick={() => { if (copySource !== null) copyRecipe(copySource); }}>Ganti bahan baku</Button></div></DialogContent></Dialog>
    <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}><DialogContent><DialogHeader><DialogTitle>Keluar dari form produk?</DialogTitle><DialogDescription>{product ? 'Perubahan belum disimpan. Keluar akan membuang perubahan pada form ini.' : 'Produk belum masuk katalog. Draft disimpan otomatis di tab ini jika penyimpanan browser tersedia.'}</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-2">{!product && <Button type="button" variant="ghost" className="h-11" onClick={() => { try { sessionStorage.removeItem(draftKey); } catch { /* Leaving is still possible when storage is unavailable. */ } savedRef.current = true; leave(); }}>Buang draft & keluar</Button>}<Button type="button" variant="outline" className="h-11" onClick={() => setConfirmLeave(false)}>Lanjut mengisi</Button><Button type="button" className="h-11" onClick={leave}>Keluar dari form</Button></div></DialogContent></Dialog>
  </div>;
}
