import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { ProductBuilder } from '@/features/recipes/components/product-builder';
import { ProductField, ProductSelect } from '@/features/recipes/components/product-form-layout';
import type { useOnboarding } from '../hooks/use-onboarding';

type Controller = Omit<ReturnType<typeof useOnboarding>, 'formRef' | 'headingRef'>;

export function OnboardingProductStep({ controller: w }: { controller: Controller }) {
  const selected = w.products.find(product => product.id === w.draft.product.existingProductId);
  return <div className="mt-6 min-w-0 space-y-5">
    {w.products.length > 0 && <ProductField id="existing-product" label="Gunakan produk yang sudah ada"><ProductSelect id="existing-product" disabled={w.busy} value={w.draft.product.existingProductId} onChange={event => w.selectProduct(event.target.value)}><option value="">Buat produk di panduan ini</option>{w.products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</ProductSelect></ProductField>}
    {selected ? <section className="space-y-4 rounded-xl border p-4 sm:p-5">
      <h2 className="text-lg font-semibold">{selected.name}</h2>
      <p className="text-sm text-muted-foreground">Gunakan produk beserta varian dan bahan baku yang sudah tersimpan.</p>
      <ul className="divide-y">{selected.variants.filter(variant => variant.isActive).map(variant => <li key={variant.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><span>{variant.variantName} · {variant.ingredients.length} bahan</span><span><CurrencyText value={variant.sellingPrice} /> / {variant.unit}</span></li>)}</ul>
      <div className="flex flex-wrap gap-2"><Button type="button" className="h-11" disabled={w.busy} onClick={() => void w.useExistingProduct()}>Gunakan produk & lihat HPP</Button><Button type="button" variant="outline" className="h-11" disabled={w.busy} onClick={() => void w.goBack(2)}>Kembali ke bahan baku</Button></div>
    </section> : <ProductBuilder
      embedded
      product={w.data?.product}
      value={w.draft.product.form}
      onChange={w.updateProductForm}
      initialStep={Math.min(w.draft.product.builderStep, w.draft.product.form.mode === 'MAKE_TO_ORDER' ? 2 : 1)}
      initialVariantIndex={w.draft.product.builderVariantIndex}
      onStepChange={w.updateBuilderStep}
      saveProduct={w.saveProductForm}
      externalBusy={w.busy}
      onCancel={() => void w.goBack(2)}
      onAddMaterial={index => void w.addMissingMaterial(index)}
    />}
    {w.error && <div role="alert" className="space-y-3 rounded-lg border border-destructive p-4 text-sm"><p>{w.error}</p><Button type="button" variant="outline" className="h-11" disabled={w.busy} onClick={() => void w.load()}>Muat ulang progres tersimpan</Button></div>}
  </div>;
}
