import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { Label } from '@/components/ui/label';
import { ProductField, ProductInput, ProductNumberInput } from './product-form-layout';
import { suggestPriceFromCost } from '../lib/product-form';
import { needsPriceReview } from '../lib/product-list';
import { productInput, recipeService } from '../services/recipe-service';
import { recipeKeys } from '../hooks/use-recipes-query';
import type { Product, ProductVariant } from '../types';
import { cn } from '@/lib/utils';

interface PriceReviewDialogProps {
  open: boolean;
  product: Product | null | undefined;
  initialVariantId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

interface VariantEditState {
  sellingPrice: number;
  targetMargin: number;
  marginText: string;
}

export function PriceReviewDialog({
  open,
  product,
  initialVariantId,
  onClose,
  onSaved,
}: PriceReviewDialogProps) {
  const queryClient = useQueryClient();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [edits, setEdits] = useState<Record<string, VariantEditState>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const variants = product?.variants ?? [];

  // Determine initial variant: prefer initialVariantId, then variant needing price review, then first variant
  const initialVariant = useMemo(() => {
    if (!variants.length) return null;
    if (initialVariantId) {
      const found = variants.find((v) => v.id === initialVariantId);
      if (found) return found;
    }
    return variants.find(needsPriceReview) ?? variants[0] ?? null;
  }, [variants, initialVariantId]);

  // Synchronize variant selection and edit state when dialog opens or product changes
  useEffect(() => {
    if (open && product) {
      const initialMap: Record<string, VariantEditState> = {};
      for (const v of product.variants) {
        initialMap[v.id] = {
          sellingPrice: v.sellingPrice,
          targetMargin: v.targetMargin,
          marginText: v.targetMargin === 0 ? '' : String(Number((v.targetMargin * 100).toFixed(2))),
        };
      }
      setEdits(initialMap);
      setError('');
      if (initialVariant) {
        setSelectedVariantId(initialVariant.id);
      }
    }
  }, [open, product, initialVariant]);

  if (!product) return null;

  const selectedVariant: ProductVariant | undefined =
    variants.find((v) => v.id === selectedVariantId) ?? initialVariant ?? variants[0];

  if (!selectedVariant) return null;

  const currentEdit = edits[selectedVariant.id] ?? {
    sellingPrice: selectedVariant.sellingPrice,
    targetMargin: selectedVariant.targetMargin,
    marginText: selectedVariant.targetMargin === 0 ? '' : String(Number((selectedVariant.targetMargin * 100).toFixed(2))),
  };

  const cost =
    selectedVariant.estimatedHpp > 0
      ? selectedVariant.estimatedHpp
      : selectedVariant.latestHpp > 0
        ? selectedVariant.latestHpp
        : null;

  const suggestedPrice = suggestPriceFromCost(cost, currentEdit.targetMargin);
  const profitDiff = cost !== null ? currentEdit.sellingPrice - cost : null;
  const profitMargin =
    cost !== null && currentEdit.sellingPrice > 0
      ? ((currentEdit.sellingPrice - cost) / currentEdit.sellingPrice) * 100
      : null;
  const isLoss = cost !== null && currentEdit.sellingPrice < cost;

  function updateMargin(text: string) {
    if (!selectedVariant) return;
    const num = Number(text);
    const targetMargin = Number.isFinite(num) && num >= 0 && num < 100 ? num / 100 : (Number.isFinite(num) && num >= 100 ? 1 : 0);
    setEdits((prev) => ({
      ...prev,
      [selectedVariant.id]: {
        ...(prev[selectedVariant.id] ?? { sellingPrice: selectedVariant.sellingPrice }),
        targetMargin,
        marginText: text,
      },
    }));
  }

  function updateSellingPrice(price: number) {
    if (!selectedVariant) return;
    setEdits((prev) => ({
      ...prev,
      [selectedVariant.id]: {
        ...(prev[selectedVariant.id] ?? { targetMargin: selectedVariant.targetMargin, marginText: '' }),
        sellingPrice: price,
      },
    }));
  }

  async function handleSave() {
    if (!product || saving) return;
    setSaving(true);
    setError('');

    try {
      const base = productInput(product);
      const updatedVariants = base.variants.map((v, i) => {
        const orig = product.variants[i];
        const edit = orig ? edits[orig.id] : undefined;
        if (edit) {
          return {
            ...v,
            sellingPrice: edit.sellingPrice,
            targetMargin: edit.targetMargin,
          };
        }
        return v;
      });

      await recipeService.updateProduct(product.id, {
        ...base,
        variants: updatedVariants,
      });

      await queryClient.invalidateQueries({ queryKey: recipeKeys.all });
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan harga baru';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !saving) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tinjau harga {product.name}</DialogTitle>
          <DialogDescription>
            Sesuaikan harga jual per varian dengan kalkulator berbasis biaya bahan baku.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-red-700 dark:text-red-300">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {variants.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pilih varian untuk ditinjau</Label>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Daftar varian">
                {variants.map((v) => {
                  const isSelected = v.id === selectedVariant.id;
                  const vNeedsReview = needsPriceReview(v);
                  const vCost = v.estimatedHpp > 0 ? v.estimatedHpp : (v.latestHpp > 0 ? v.latestHpp : null);
                  const vPrice = edits[v.id]?.sellingPrice ?? v.sellingPrice;
                  const vLoss = vCost !== null && vPrice < vCost;

                  return (
                    <Button
                      key={v.id}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'secondary' : 'outline'}
                      className={cn(
                        'h-9 gap-1.5 text-xs',
                        (vNeedsReview || vLoss) && !isSelected && 'border-amber-500/60 text-amber-700 dark:text-amber-400'
                      )}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedVariantId(v.id)}
                    >
                      {(vNeedsReview || vLoss) && (
                        <AlertCircle className="size-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      )}
                      <span>{v.variantName}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs text-muted-foreground">Biaya bahan baku</span>
                <span className="mt-0.5 block font-semibold tabular-nums">
                  {selectedVariant.estimatedHpp > 0 ? (
                    <CurrencyText value={selectedVariant.estimatedHpp} />
                  ) : selectedVariant.latestHpp > 0 ? (
                    <CurrencyText value={selectedVariant.latestHpp} />
                  ) : (
                    'Belum dihitung'
                  )}
                </span>
              </div>
              {selectedVariant.latestHpp > 0 && selectedVariant.estimatedHpp > 0 && (
                <div>
                  <span className="block text-xs text-muted-foreground">HPP produksi</span>
                  <span className="mt-0.5 block font-semibold tabular-nums">
                    <CurrencyText value={selectedVariant.latestHpp} />
                  </span>
                </div>
              )}
              <div>
                <span className="block text-xs text-muted-foreground">Harga jual saat ini</span>
                <span className="mt-0.5 block font-semibold tabular-nums">
                  <CurrencyText value={selectedVariant.sellingPrice} />
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ProductField id="variant-name" label="Nama varian">
              <ProductInput
                id="variant-name"
                value={selectedVariant.variantName}
                readOnly
                className="bg-muted/50 font-medium"
              />
            </ProductField>

            <ProductField
              id="variant-margin"
              label="Margin (%)"
              hint="Dihitung dari harga jual: Modal ÷ (1 - Margin). Contoh: Margin 50% berarti modal adalah 50% dari harga jual."
            >
              <ProductNumberInput
                id="variant-margin"
                suffix="%"
                allowDecimal
                maxDecimals={2}
                valueType="string"
                value={currentEdit.marginText}
                placeholder="0"
                onChange={(text: string) => updateMargin(text)}
              />
            </ProductField>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Saran harga jual</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {suggestedPrice === null ? 'Lengkapi biaya bahan dulu' : <CurrencyText value={suggestedPrice} />}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                disabled={suggestedPrice === null || suggestedPrice === currentEdit.sellingPrice}
                onClick={() => {
                  if (suggestedPrice !== null) {
                    updateSellingPrice(suggestedPrice);
                  }
                }}
              >
                Pakai hasil perhitungan
              </Button>
            </div>

            <ProductField
              id="variant-price"
              label="Harga jual (Rp)"
              hint="Harga baru yang akan disimpan untuk varian ini."
            >
              <ProductNumberInput
                id="variant-price"
                prefix="Rp"
                allowDecimal
                maxDecimals={4}
                value={currentEdit.sellingPrice}
                onChange={(value) => updateSellingPrice(Number(value))}
              />
            </ProductField>

            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Proyeksi Laba & Margin Baru</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Selisih laba kotor</dt>
                  <dd
                    className={cn(
                      'mt-0.5 font-semibold tabular-nums',
                      profitDiff !== null && profitDiff < 0 && 'text-red-700 dark:text-red-300'
                    )}
                  >
                    {profitDiff === null ? 'Belum tersedia' : <CurrencyText value={profitDiff} />}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Margin keuntungan</dt>
                  <dd
                    className={cn(
                      'mt-0.5 font-semibold tabular-nums',
                      profitMargin !== null && profitMargin < 0 && 'text-red-700 dark:text-red-300'
                    )}
                  >
                    {profitMargin === null
                      ? 'Belum tersedia'
                      : `${profitMargin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`}
                  </dd>
                </div>
              </dl>
              {isLoss && (
                <FeedbackAlert>
                  Harga jual saat ini lebih rendah dari perkiraan biaya bahan.
                </FeedbackAlert>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || currentEdit.sellingPrice < 0}
          >
            {saving ? 'Menyimpan...' : 'Simpan harga baru'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
