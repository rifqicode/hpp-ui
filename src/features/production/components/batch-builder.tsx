import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Plus,
  Minus,
  Search,
  X,
  Loader2,
  Factory,
  Check,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyText } from '@/components/ui/currency-text';
import { useInitialLoading } from '@/hooks/use-initial-loading';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';
import {
  productionBatchService,
  type ProductionHead,
  type ProductionBatchPreview,
} from '@/features/production/services/production-batch-service';
import { presentProductionHead } from '@/features/production/services/production-batch-presentation';
import { recipeService } from '@/features/recipes/services/recipe-service';
import type { ProductVariantView } from '@/features/recipes/types';
import type { ProductionBatch, ProductionPreviewResponse } from '@/features/production/types';

const STEPS = ['Pilih Produk', 'Target & Audit Stok', 'Review & Konfirmasi'] as const;

export interface SelectedBatchItem {
  key: string;
  variantId: string;
  quantity: number | '';
  notes?: string;
}

export interface BatchBuilderProps {
  batch?: ProductionHead;
  onHeadSaved?: (head: ProductionHead) => void;
  onSaved?: (batch: ProductionBatch) => void;
  onCancel?: () => void;
  initialStep?: number;
}

export function BatchBuilder({
  batch,
  onHeadSaved,
  onSaved,
  onCancel,
  initialStep = 0,
}: BatchBuilderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeId = useAuthStore(s => s.activeStoreId);
  const topRef = React.useRef<HTMLDivElement>(null);

  // Stepper State
  const [step, setStep] = React.useState<number>(initialStep);
  const [visited, setVisited] = React.useState<number>(initialStep);
  const [confirmLeave, setConfirmLeave] = React.useState<boolean>(false);

  // Unified Multi-Variant Form State
  const initializedDefaultRef = React.useRef<boolean>(Boolean(batch));
  const [selectedItems, setSelectedItems] = React.useState<SelectedBatchItem[]>(() =>
    batch?.logs.length
      ? batch.logs.map(log => ({
          key: log.id,
          variantId: log.variant_id,
          quantity: Number(log.target_quantity || 1),
          notes: log.notes || '',
        }))
      : [],
  );
  const [chefName, setChefName] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>(batch?.notes || '');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [collapsedKeys, setCollapsedKeys] = React.useState<Record<string, boolean>>({});

  function toggleVariantCollapse(key: string) {
    setCollapsedKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  // Request States
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  // Fetch MAKE_TO_STOCK product variants
  const {
    data: products = [],
    isLoading: loadingProducts,
    isError: isProductsError,
  } = useQuery({
    queryKey: ['production-recipe-variants', storeId],
    queryFn: async () => {
      const variants = await recipeService.getVariants();
      return variants.filter(v => v.mode === 'MAKE_TO_STOCK' && v.isActive);
    },
    enabled: Boolean(storeId),
  });

  // Default-select the first available product when creating a new batch
  React.useEffect(() => {
    if (!initializedDefaultRef.current && products.length > 0 && selectedItems.length === 0) {
      initializedDefaultRef.current = true;
      setSelectedItems([
        {
          key: crypto.randomUUID(),
          variantId: products[0].id,
          quantity: 1,
        },
      ]);
    }
  }, [products, selectedItems.length]);

  const selectedProductId = selectedItems[0]?.variantId || '';

  const selectedProduct = React.useMemo<ProductVariantView | null>(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const effectiveQty =
    typeof selectedItems[0]?.quantity === 'number'
      ? selectedItems[0].quantity
      : Number(selectedItems[0]?.quantity) || 0;

  const previewItems = React.useMemo(
    () =>
      selectedItems.map(item => ({
        variant_id: item.variantId,
        planned_qty: String(
          typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0,
        ),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    [selectedItems],
  );

  const canSubmitItems = React.useMemo(
    () =>
      selectedItems.length > 0 &&
      selectedItems.every(item => {
        const q = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
        return Boolean(item.variantId) && Number.isFinite(q) && q > 0;
      }),
    [selectedItems],
  );

  const previewQuery = useQuery({
    queryKey: ['production-preview', storeId, previewItems],
    queryFn: () =>
      productionBatchService.preview({
        notes: '',
        draft: false,
        items: previewItems,
      }),
    enabled: Boolean(storeId) && canSubmitItems,
    retry: false,
  });
  const batchPreview: ProductionBatchPreview | undefined = previewQuery.data;
  const loadingPreview = previewQuery.isFetching;
  const preview = React.useMemo<ProductionPreviewResponse | null>(() => {
    const first = batchPreview?.items[0];
    return first && batchPreview
      ? {
          ...first,
          items: batchPreview.ingredients,
          is_all_sufficient: batchPreview.is_all_sufficient,
          estimated_bom: batchPreview.ingredients.reduce(
            (sum, item) => sum + Number(item.estimated_cost),
            0,
          ),
        }
      : null;
  }, [batchPreview]);

  // Per-variant breakdown (1-per-1) combining server preview and local product recipe fallback
  const variantBreakdowns = React.useMemo(() => {
    const combinedByStockId = new Map((batchPreview?.ingredients || []).map(i => [i.stock_id, i]));

    const rawBreakdowns = selectedItems.map((item, index) => {
      const product = products.find(p => p.id === item.variantId) || null;
      const qty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0;
      const scaleQty = Math.max(0, qty);
      const serverItem = batchPreview?.items[index];

      const rawIngredients =
        serverItem?.items && serverItem.items.length > 0
          ? serverItem.items.map(ing => {
              const unitQty =
                scaleQty > 0 ? Number(ing.required_qty) / scaleQty : Number(ing.required_qty);
              const shortage = ing.is_sufficient
                ? 0
                : Math.max(0, Number(ing.required_qty) - Number(ing.available_qty));
              return {
                stockId: ing.stock_id,
                stockName: ing.stock_name,
                unit: ing.unit,
                unitQty,
                requiredQty: Number(ing.required_qty),
                availableQty: Number(ing.available_qty),
                isSufficient: ing.is_sufficient,
                shortage,
                estimatedCost: Number(ing.estimated_cost),
              };
            })
          : batchPreview?.ingredients &&
              batchPreview.ingredients.length > 0 &&
              (selectedItems.length === 1 || !product?.ingredients?.length)
            ? batchPreview.ingredients.map(ing => {
                const unitQty =
                  scaleQty > 0 ? Number(ing.required_qty) / scaleQty : Number(ing.required_qty);
                const shortage = ing.is_sufficient
                  ? 0
                  : Math.max(0, Number(ing.required_qty) - Number(ing.available_qty));
                return {
                  stockId: ing.stock_id,
                  stockName: ing.stock_name,
                  unit: ing.unit,
                  unitQty,
                  requiredQty: Number(ing.required_qty),
                  availableQty: Number(ing.available_qty),
                  isSufficient: ing.is_sufficient,
                  shortage,
                  estimatedCost: Number(ing.estimated_cost),
                };
              })
            : (product?.ingredients || []).map(ing => {
                const unitQty = ing.quantity || 0;
                const requiredQty = unitQty * scaleQty;
                const availableQty = ing.availableStock || 0;
                const isSufficient = availableQty >= requiredQty;
                const shortage = isSufficient ? 0 : Math.max(0, requiredQty - availableQty);
                const estimatedCost = (ing.subtotalCost || 0) * scaleQty;
                return {
                  stockId: ing.stockId,
                  stockName: ing.stockName,
                  unit: ing.baseUnit,
                  unitQty,
                  requiredQty,
                  availableQty,
                  isSufficient,
                  shortage,
                  estimatedCost,
                };
              });

      return {
        item,
        index,
        product,
        scaleQty,
        serverItem,
        rawIngredients,
      };
    });

    // Aggregate total required qty per stockId across all variants in the batch
    const batchTotalsByStockId = new Map<string, { totalRequired: number; availableQty: number }>();
    for (const rb of rawBreakdowns) {
      for (const ing of rb.rawIngredients) {
        const existing = batchTotalsByStockId.get(ing.stockId);
        if (existing) {
          existing.totalRequired += ing.requiredQty;
        } else {
          batchTotalsByStockId.set(ing.stockId, {
            totalRequired: ing.requiredQty,
            availableQty: ing.availableQty,
          });
        }
      }
    }

    return rawBreakdowns.map(({ item, index, product, scaleQty, serverItem, rawIngredients }) => {
      const ingredients = rawIngredients.map(ing => {
        const combinedServer = combinedByStockId.get(ing.stockId);
        const batchTotal = batchTotalsByStockId.get(ing.stockId);
        const availableQty = combinedServer
          ? Number(combinedServer.available_qty)
          : ing.availableQty;
        const combinedSufficient = combinedServer
          ? combinedServer.is_sufficient
          : batchTotal
            ? availableQty >= batchTotal.totalRequired
            : ing.isSufficient;
        const isSufficient = ing.isSufficient && combinedSufficient;
        const combinedShortage = combinedServer
          ? Math.max(0, Number(combinedServer.required_qty) - Number(combinedServer.available_qty))
          : batchTotal
            ? Math.max(0, batchTotal.totalRequired - availableQty)
            : 0;
        const ownShortage = Math.max(0, ing.requiredQty - availableQty);
        const shortage = isSufficient ? 0 : ownShortage > 0 ? ownShortage : combinedShortage;

        return {
          ...ing,
          availableQty,
          isSufficient,
          shortage,
        };
      });

      const estimatedBom =
        serverItem !== undefined
          ? Number(serverItem.estimated_bom)
          : ingredients.reduce((sum, ing) => sum + ing.estimatedCost, 0);

      const estimatedHpp =
        serverItem !== undefined
          ? Number(serverItem.estimated_hpp)
          : scaleQty > 0
            ? Math.round(estimatedBom / scaleQty)
            : 0;

      return {
        key: item.key,
        variantId: item.variantId,
        product,
        productName: product?.name || serverItem?.product_name || `Varian ${index + 1}`,
        category: product?.category || 'Umum',
        unit: product?.unit || 'pcs',
        sellingPrice: product?.sellingPrice || 0,
        plannedQty: scaleQty,
        ingredients,
        estimatedBom,
        estimatedHpp,
        isAllSufficient:
          serverItem !== undefined
            ? serverItem.is_all_sufficient && ingredients.every(i => i.isSufficient)
            : ingredients.every(i => i.isSufficient),
      };
    });
  }, [selectedItems, products, batchPreview]);

  // Combined ingredient audit (1 row per stock_id across the entire batch)
  const ingredientAudit = React.useMemo(() => {
    if (batchPreview && batchPreview.ingredients && batchPreview.ingredients.length > 0) {
      return batchPreview.ingredients.map(i => {
        const shortage = i.is_sufficient
          ? 0
          : Math.max(0, Number(i.required_qty) - Number(i.available_qty));
        const baseQty =
          selectedItems.length === 1 && effectiveQty > 0
            ? Number(i.required_qty) / effectiveQty
            : Number(i.required_qty);
        return {
          id: i.stock_id,
          stockId: i.stock_id,
          stockName: i.stock_name,
          baseUnit: i.unit,
          quantity: baseQty,
          neededQty: Number(i.required_qty),
          availableStock: Number(i.available_qty),
          isSufficient: i.is_sufficient,
          shortage,
          estimatedCost: Number(i.estimated_cost),
        };
      });
    }

    // Aggregate from variantBreakdowns by stockId
    const map = new Map<
      string,
      {
        id: string;
        stockId: string;
        stockName: string;
        baseUnit: string;
        quantity: number;
        neededQty: number;
        availableStock: number;
        isSufficient: boolean;
        shortage: number;
        estimatedCost: number;
      }
    >();

    for (const vb of variantBreakdowns) {
      for (const ing of vb.ingredients) {
        const existing = map.get(ing.stockId);
        if (existing) {
          existing.neededQty += ing.requiredQty;
          existing.estimatedCost += ing.estimatedCost;
          existing.isSufficient = existing.availableStock >= existing.neededQty;
          existing.shortage = existing.isSufficient
            ? 0
            : Math.max(0, existing.neededQty - existing.availableStock);
        } else {
          map.set(ing.stockId, {
            id: ing.stockId,
            stockId: ing.stockId,
            stockName: ing.stockName,
            baseUnit: ing.unit,
            quantity: ing.unitQty,
            neededQty: ing.requiredQty,
            availableStock: ing.availableQty,
            isSufficient: ing.availableQty >= ing.requiredQty,
            shortage:
              ing.availableQty >= ing.requiredQty
                ? 0
                : Math.max(0, ing.requiredQty - ing.availableQty),
            estimatedCost: ing.estimatedCost,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [batchPreview, selectedItems.length, effectiveQty, variantBreakdowns]);

  const allIngredientsAvailable = React.useMemo(() => {
    if (batchPreview) return batchPreview.is_all_sufficient;
    return ingredientAudit.length > 0 && ingredientAudit.every(i => i.isSufficient);
  }, [batchPreview, ingredientAudit]);

  const totalEstimatedRawCost = React.useMemo(() => {
    if (preview) return preview.estimated_bom;
    return ingredientAudit.reduce((acc, curr) => acc + curr.estimatedCost, 0);
  }, [preview, ingredientAudit]);

  const estimatedHppPerUnit = React.useMemo(() => {
    if (variantBreakdowns.length === 1) return variantBreakdowns[0].estimatedHpp;
    if (preview) return preview.estimated_hpp;
    const qty = Math.max(1, effectiveQty);
    return Math.round(totalEstimatedRawCost / qty);
  }, [variantBreakdowns, preview, totalEstimatedRawCost, effectiveQty]);

  const sellingPrice = selectedProduct?.sellingPrice || 0;
  const projectedRevenue = React.useMemo(
    () => variantBreakdowns.reduce((sum, vb) => sum + vb.sellingPrice * vb.plannedQty, 0),
    [variantBreakdowns],
  );
  const projectedGrossProfit = projectedRevenue - totalEstimatedRawCost;
  const projectedMargin =
    projectedRevenue > 0 ? Math.round((projectedGrossProfit / projectedRevenue) * 1000) / 10 : 0;

  // Category list for filter
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered recipes
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Stepper navigation helpers
  function goTo(nextStep: number) {
    setError('');
    setStep(nextStep);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleProductSelection(variantId: string) {
    initializedDefaultRef.current = true;
    setSelectedItems(prev => {
      const exists = prev.some(item => item.variantId === variantId);
      if (exists) {
        return prev.filter(item => item.variantId !== variantId);
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          variantId,
          quantity: 1,
        },
      ];
    });
    setError('');
  }

  function updateItemQuantity(key: string, nextQuantity: number | '') {
    setSelectedItems(prev =>
      prev.map(item => (item.key === key ? { ...item, quantity: nextQuantity } : item)),
    );
    setError('');
  }

  function stepItemQuantity(key: string, delta: number) {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.key !== key) return item;
        const current = Number(item.quantity) || 0;
        let nextVal = current + delta;
        if (delta < 0 && current <= 1) nextVal = 1;
        else if (delta < 0 && current <= 10) nextVal = Math.max(1, current - 1);
        else nextVal = Math.max(1, current + delta);
        return { ...item, quantity: nextVal };
      }),
    );
    setError('');
  }

  function removeVariantRow(key: string) {
    initializedDefaultRef.current = true;
    setSelectedItems(prev => prev.filter(item => item.key !== key));
    setError('');
  }

  function validate(stepIndex: number): string | null {
    if (stepIndex === 0) {
      const validSelected = selectedItems.filter(
        item => item.variantId && products.some(p => p.id === item.variantId),
      );
      if (validSelected.length === 0) {
        return 'Pilih minimal satu produk terlebih dahulu sebelum melanjutkan.';
      }
    }
    if (stepIndex === 1) {
      if (selectedItems.length === 0) {
        return 'Pilih minimal satu produk terlebih dahulu sebelum melanjutkan.';
      }
      if (selectedItems.some(item => !item.variantId)) {
        return 'Pilih varian untuk seluruh baris produksi sebelum melanjutkan.';
      }
      if (new Set(selectedItems.map(item => item.variantId)).size !== selectedItems.length) {
        return 'Ada varian yang dipilih lebih dari sekali.';
      }
      if (
        selectedItems.some(item => {
          const q = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
          return !Number.isFinite(q) || q <= 0;
        })
      ) {
        return 'Target kuantitas produksi harus lebih dari 0.';
      }
    }
    return null;
  }

  function next() {
    const validationError = validate(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setVisited(prev => Math.max(prev, step + 1));
    goTo(step + 1);
  }

  function handleStepClick(targetStep: number) {
    if (targetStep > step) {
      for (let s = step; s < targetStep; s++) {
        const validationError = validate(s);
        if (validationError) {
          setError(validationError);
          return;
        }
      }
    }
    goTo(targetStep);
  }

  const dirty = Boolean(
    selectedItems.length > 1 ||
    (selectedProduct && products.length > 0 && selectedProductId !== products[0]?.id) ||
    effectiveQty !== 1 ||
    chefName !== '' ||
    notes !== '',
  );

  function leave() {
    if (onCancel) onCancel();
    else navigate('/production/batches');
  }

  function cancel() {
    if (dirty) {
      setConfirmLeave(true);
    } else {
      leave();
    }
  }

  // Submit batch
  async function handleSubmit(e?: React.FormEvent, draft = false) {
    if (e) e.preventDefault();
    for (let s = 0; s <= 1; s++) {
      const validationError = validate(s);
      if (validationError) {
        goTo(s);
        setError(validationError);
        return;
      }
    }

    if (!canSubmitItems) {
      setError('Target kuantitas produksi harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const combinedNotes = [
        chefName.trim() ? `Penanggung Jawab: ${chefName.trim()}` : '',
        notes.trim() ? `Catatan: ${notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const head = await productionBatchService.save(
        { notes: combinedNotes, draft, items: previewItems },
        batch?.id,
      );
      const newBatch = presentProductionHead(head);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['production'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription-usage'] }),
      ]);

      window.dispatchEvent(
        new CustomEvent('guidance-task-success', {
          detail: { feature: 'production' },
        }),
      );

      if (onHeadSaved) {
        onHeadSaved(head);
      } else if (onSaved) {
        onSaved(newBatch);
      } else {
        navigate(`/production/batches/${newBatch.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai batch produksi';
      setError(msg);
      setSubmitting(false);
    }
  }

  const isInitialLoading = useInitialLoading(loadingProducts);
  if (isInitialLoading) {
    return <div className="min-h-[60vh]" />;
  }

  return (
    <div ref={topRef} className="flex flex-col gap-6 pb-24 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/production/batches" className="hover:text-foreground transition-colors">
          Dapur Produksi
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/production/batches" className="hover:text-foreground transition-colors">
          Batches
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Mulai Batch Baru</span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={cancel}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Kembali ke Daftar Batch"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {batch ? 'Edit Draft Produksi' : 'Mulai Batch Produksi Baru'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Alur bertahap: pilih satu atau beberapa produk/varian, atur target & verifikasi stok
              FIFO, lalu konfirmasi.
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Header (Identical pattern to ProductBuilder) */}
      <nav aria-label="Tahapan Pembuatan Batch">
        <ol className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border pb-4">
          {STEPS.map((label, i) => {
            const isActive = step === i;
            const isCompleted = i < step;
            const isAccessible = i <= visited;
            return (
              <li key={label}>
                <button
                  type="button"
                  aria-current={isActive ? 'step' : undefined}
                  disabled={submitting || !isAccessible}
                  onClick={() => handleStepClick(i)}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                    isActive
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : isCompleted
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                          : 'border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="size-3.5 stroke-[3]" aria-hidden /> : i + 1}
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-in fade-in"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-xs sm:text-sm">Periksa Isian Sebelum Melanjutkan</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError('')}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {previewQuery.isError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
        >
          Preview bahan belum berhasil dimuat.{' '}
          <button type="button" onClick={() => void previewQuery.refetch()} className="underline">
            Coba lagi
          </button>
        </p>
      )}

      {/* Main Step Content */}
      <div className="space-y-6">
        {/* STEP 0: PILIH PRODUK (MULTI-SELECT) */}
        {step === 0 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Pilih Produk
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Pilih satu atau beberapa produk/varian yang akan dimasak dalam batch ini.
                      Hanya produk dengan metode <em>Siapkan stok dulu</em> dan formulasi bahan baku
                      aktif yang dapat diproduksi di dapur.
                    </CardDescription>
                  </div>
                </div>

                {/* Search & Category Filter Toolbar */}
                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Cari produk atau kategori..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-8 h-10 rounded-xl text-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="pt-3 flex flex-wrap items-center gap-2">
                  {categories.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory('all')}
                        className="h-8 text-xs rounded-lg px-3 shrink-0"
                      >
                        Semua Kategori
                      </Button>
                      {categories.map(cat => (
                        <Button
                          key={cat}
                          type="button"
                          size="sm"
                          variant={selectedCategory === cat ? 'default' : 'outline'}
                          onClick={() => setSelectedCategory(cat)}
                          className="h-8 text-xs rounded-lg px-3 shrink-0"
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isProductsError && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    Gagal memuat data produk. Silakan muat ulang halaman.
                  </div>
                )}

                {filteredProducts.length === 0 && (
                  <div className="py-12 px-4 text-center border border-dashed rounded-xl space-y-2">
                    <Boxes className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada product yang sesuai
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {searchQuery
                        ? 'Coba gunakan kata kunci pencarian lain atau ubah filter kategori.'
                        : 'Belum ada produk dengan metode "Siapkan stok dulu" dan bahan baku aktif di toko ini.'}
                    </p>
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredProducts.map(prod => {
                      const selectedIndex = selectedItems.findIndex(
                        item => item.variantId === prod.id,
                      );
                      const isSelected = selectedIndex !== -1;
                      return (
                        <div
                          key={prod.id}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => toggleProductSelection(prod.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleProductSelection(prod.id);
                            }
                          }}
                          className={cn(
                            'p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                              : 'border-border hover:border-primary/40 hover:bg-muted/40',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-2 font-medium"
                                >
                                  {prod.category || 'Umum'}
                                </Badge>
                                {isSelected && (
                                  <Badge
                                    variant="default"
                                    className="text-[10px] py-0 px-2 font-semibold"
                                  >
                                    Varian #{selectedIndex + 1}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-bold text-sm text-foreground truncate">
                                {prod.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Stok Jadi:{' '}
                                <strong className="text-foreground font-semibold">
                                  {prod.currentStock} {prod.unit}
                                </strong>
                              </p>
                            </div>

                            <div
                              className={cn(
                                'h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border',
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Harga Jual:</span>
                            <span className="font-mono font-semibold text-foreground">
                              <CurrencyText value={prod.sellingPrice} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 1: TARGET & AUDIT STOK */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Section — Informasi & Parameter Batch Dapur */}
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Informasi & Parameter Batch Dapur
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Tentukan penanggung jawab produksi, catatan batch, serta target kuantitas
                      masing-masing varian di bawah.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold py-1 px-2.5">
                      {selectedItems.length} Varian Dipilih
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(0)}
                      className="h-8 text-xs font-semibold text-primary hover:text-primary rounded-lg"
                    >
                      Ganti Produk
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="batch-chef-name"
                      className="text-xs font-semibold text-foreground"
                    >
                      Penanggung Jawab / Baker (Opsional)
                    </Label>
                    <Input
                      id="batch-chef-name"
                      placeholder=""
                      value={chefName}
                      onChange={e => setChefName(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="batch-notes" className="text-xs font-semibold text-foreground">
                      Catatan Batch Produksi (Opsional)
                    </Label>
                    <Input
                      id="batch-notes"
                      placeholder=""
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Middle Section — Unified Variant Rows (Recipe & Cost Breakdown) */}
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Target Produksi & Rincian Bahan Baku
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Atur target produksi setiap varian pada baris ringkas di bawah. Klik baris
                      varian untuk melipat atau membuka tabel rincian bahan baku
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Unified Compact Single-Header Rows per Variant */}
              {variantBreakdowns.length > 0 && (
                <div className="px-4 sm:px-6 pb-4 space-y-3">
                  {variantBreakdowns.map((vb, index) => {
                    const item = selectedItems[index];
                    if (!item) return null;
                    const prod = vb.product;
                    const itemQty =
                      typeof item.quantity === 'number'
                        ? item.quantity
                        : Number(item.quantity) || 0;
                    const isExpanded = !collapsedKeys[vb.key];

                    return (
                      <div
                        key={vb.key}
                        className="rounded-xl border border-border overflow-hidden bg-card shadow-xs transition-all"
                      >
                        {/* Single-Header Row Layout */}
                        <div className="px-3.5 py-3 bg-muted/25 hover:bg-muted/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Left + Middle Zones: Clickable Toggle Area */}
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Sembunyikan' : 'Tampilkan'} rincian bahan ${vb.productName}`}
                            onClick={() => toggleVariantCollapse(vb.key)}
                            className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg min-w-0 cursor-pointer"
                          >
                            {/* Left zone: Chevron + Variant Identity */}
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                              <span className="h-7 w-7 rounded-lg border border-border/80 bg-background flex items-center justify-center shrink-0 text-muted-foreground mt-0.5 sm:mt-0">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {vb.productName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Stok:{' '}
                                  <strong className="text-foreground">
                                    {prod?.currentStock ?? 0} {vb.unit}
                                  </strong>{' '}
                                  · Harga Jual:{' '}
                                  <strong className="text-foreground font-mono">
                                    <CurrencyText value={vb.sellingPrice} />
                                  </strong>
                                </p>
                              </div>
                            </div>

                            {/* Middle zone: Financial Summary (always visible) */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pl-9 sm:pl-0 shrink-0">
                              <div className="text-left sm:text-right">
                                <div className="font-mono text-sm font-bold text-primary">
                                  Est. HPP/Unit: <CurrencyText value={vb.estimatedHpp} /> /{' '}
                                  {vb.unit}
                                </div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  Est. Biaya Bahan:{' '}
                                  <strong className="text-foreground">
                                    <CurrencyText value={vb.estimatedBom} />
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Right zone: Interactive Quantity Stepper (isolated from collapse toggle) */}
                          <div
                            className="flex items-center gap-2 shrink-0 pl-9 lg:pl-3 lg:border-l lg:border-border/60"
                            onClick={e => e.stopPropagation()}
                          >
                            <Label htmlFor={`variant-qty-${item.key}`} className="sr-only">
                              Target Jumlah Unit Produksi ({vb.productName})
                            </Label>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => stepItemQuantity(item.key, -1)}
                              disabled={submitting || itemQty <= 1}
                              className="h-9 w-9 rounded-lg shrink-0"
                              title="-10 unit (atau -1 jika di bawah 10)"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <Input
                              id={`variant-qty-${item.key}`}
                              aria-label={`Target Jumlah Unit Produksi (${vb.productName})`}
                              type="number"
                              min="0.0001"
                              step="any"
                              placeholder="1"
                              disabled={submitting}
                              value={item.quantity}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '') {
                                  updateItemQuantity(item.key, '');
                                } else {
                                  const parsed = Number(val);
                                  updateItemQuantity(item.key, Number.isNaN(parsed) ? '' : parsed);
                                }
                              }}
                              onBlur={() => {
                                const current = Number(item.quantity);
                                if (
                                  item.quantity === '' ||
                                  !Number.isFinite(current) ||
                                  current <= 0
                                ) {
                                  updateItemQuantity(item.key, 1);
                                }
                              }}
                              className="h-9 w-24 text-center font-mono font-bold text-sm text-primary rounded-lg"
                              required
                            />

                            <span className="text-xs font-semibold text-muted-foreground min-w-[2rem]">
                              {vb.unit}
                            </span>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={submitting}
                              onClick={() => stepItemQuantity(item.key, 1)}
                              className="h-9 w-9 rounded-lg shrink-0"
                              title="+10 unit"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>

                            {selectedItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Hapus varian ${index + 1}`}
                                disabled={submitting}
                                onClick={() => removeVariantRow(item.key)}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive ml-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Drawer Body (Expanded State) */}
                        {isExpanded && (
                          <div className="border-t border-border/60 overflow-x-auto">
                            {vb.ingredients.length === 0 ? (
                              <p className="p-4 text-muted-foreground text-sm">
                                Belum ada rincian bahan baku untuk varian ini.
                              </p>
                            ) : (
                              <Table className="min-w-[540px]">
                                <TableHeader className="bg-muted/20">
                                  <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                                      Bahan Baku
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                                      Takaran / Unit
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                                      Total Kebutuhan
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                                      Est. Biaya Bahan
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {vb.ingredients.map(ingredient => (
                                    <TableRow
                                      key={ingredient.stockId}
                                      className="hover:bg-muted/20"
                                    >
                                      <TableCell className="font-semibold text-sm text-foreground">
                                        {ingredient.stockName}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                        {ingredient.unitQty.toLocaleString('id-ID')}{' '}
                                        {ingredient.unit}
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                                        {ingredient.requiredQty.toLocaleString('id-ID')}{' '}
                                        {ingredient.unit}
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                                        <CurrencyText value={ingredient.estimatedCost} />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                                <TableFooter className="bg-muted/20 font-semibold text-sm">
                                  <TableRow className="hover:bg-muted/20">
                                    <TableCell className="font-semibold text-sm text-foreground">
                                      Subtotal {vb.productName}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                      Target: {vb.plannedQty} {vb.unit}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-primary font-bold">
                                      HPP/Unit: <CurrencyText value={vb.estimatedHpp} /> / {vb.unit}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                                      <CurrencyText value={vb.estimatedBom} />
                                    </TableCell>
                                  </TableRow>
                                </TableFooter>
                              </Table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-4 sm:px-6 py-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                <span className="text-muted-foreground font-medium">
                  Total Estimasi Konsumsi Biaya Bahan Baku:
                </span>
                <span className="font-mono font-bold text-base sm:text-lg text-foreground">
                  <CurrencyText value={totalEstimatedRawCost} />
                </span>
              </div>
            </Card>

            {/* Bottom Section — Dedicated Warehouse Stock Status Card */}
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Status Stok Bahan Baku
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Perbandingan stok yang tersedia di gudang saat ini dengan total bahan baku
                      yang akan dipakai pada batch produksi ini.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {loadingPreview && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {allIngredientsAvailable ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Stok Tersedia</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Sebagian Stok Kurang</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {!allIngredientsAvailable && (
                <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">Perhatian: Stok Gudang Kurang</p>
                    <p className="mt-0.5 text-xs leading-relaxed">
                      Beberapa bahan baku tidak mencukupi untuk total kebutuhan gabungan batch ini.
                      Anda dapat mengurangi kuantitas target produksi atau membuat Purchase Order ke
                      supplier terlebih dahulu.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto mt-2">
                {ingredientAudit.length === 0 ? (
                  <p className="p-4 text-muted-foreground text-sm">
                    Belum ada bahan baku yang dikalkulasi.
                  </p>
                ) : (
                  <Table className="min-w-[540px]">
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                          Bahan Baku
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                          Stok di Gudang
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                          Stok yang Akan Dipakai
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientAudit.map(ing => (
                        <TableRow key={ing.stockId} className="hover:bg-muted/20">
                          <TableCell className="font-semibold text-sm text-foreground">
                            {ing.stockName}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {ing.availableStock.toLocaleString('id-ID')} {ing.baseUnit}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                            {ing.neededQty.toLocaleString('id-ID')} {ing.baseUnit}
                          </TableCell>
                          <TableCell className="text-right">
                            {ing.isSufficient ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold py-0.5 px-2.5"
                              >
                                ✓ Cukup
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-xs font-semibold py-0.5 px-2.5"
                              >
                                Kurang {ing.shortage.toLocaleString('id-ID')} {ing.baseUnit}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: REVIEW & KONFIRMASI */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Left 7 cols: Summary & Operational Guidance */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Summary Card */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Rangkuman Parameter Batch
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Tinjau kembali seluruh varian dan parameter batch sebelum disimpan ke antrian.
                    Stok bahan dipotong ketika produksi dimulai.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">
                        Daftar Varian dalam Batch ({variantBreakdowns.length} Varian)
                      </p>
                    </div>
                    <div className="divide-y divide-border/60">
                      {variantBreakdowns.map((vb, idx) => (
                        <div
                          key={vb.key}
                          className="py-2 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-semibold text-foreground">
                              {idx + 1}. {vb.productName}
                            </span>
                            <span className="text-muted-foreground ml-2 text-[11px]">
                              ({vb.category})
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {vb.plannedQty} {vb.unit}
                            </Badge>
                            <span className="text-muted-foreground">
                              Est. HPP:{' '}
                              <strong className="text-foreground">
                                <CurrencyText value={vb.estimatedHpp} />/{vb.unit}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Produk Acuan:</dt>
                      <dd className="font-bold text-foreground text-sm">
                        {variantBreakdowns.length > 1
                          ? `${variantBreakdowns[0]?.productName} (+${
                              variantBreakdowns.length - 1
                            } varian lainnya)`
                          : selectedProduct?.name}
                      </dd>
                      <dd className="text-muted-foreground text-[11px]">
                        Kategori: {selectedProduct?.category || 'Umum'}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Target Produksi:</dt>
                      <dd className="font-bold text-foreground text-sm font-mono">
                        {variantBreakdowns.length > 1
                          ? `${variantBreakdowns.length} varian produksi`
                          : `${effectiveQty} ${selectedProduct?.unit || 'pcs'}`}
                      </dd>
                      <dd className="text-muted-foreground text-[11px]">
                        {variantBreakdowns.length > 1
                          ? variantBreakdowns
                              .map(vb => `${vb.productName}: ${vb.plannedQty} ${vb.unit}`)
                              .join(' · ')
                          : `Skala: ${effectiveQty}x formula standar`}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Penanggung Jawab:</dt>
                      <dd className="font-semibold text-foreground">{chefName.trim() || '-'}</dd>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Kesiapan Stok</dt>
                      <dd>
                        {allIngredientsAvailable ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Stok Siap 100%
                          </span>
                        ) : (
                          <span className="text-destructive font-semibold flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5" /> Sebagian Stok Kurang
                          </span>
                        )}
                      </dd>
                    </div>

                    <div className="sm:col-span-2 p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Catatan Batch:</dt>
                      <dd className="text-foreground">
                        {notes.trim() || 'Tidak ada catatan tambahan.'}
                      </dd>
                    </div>
                  </dl>

                  {/* Quick Edit Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground mr-1">Ingin mengubah?</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(0)}
                      className="h-8 text-xs rounded-lg"
                    >
                      Ubah Produk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(1)}
                      className="h-8 text-xs rounded-lg"
                    >
                      Ubah Target
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(1)}
                      className="h-8 text-xs rounded-lg"
                    >
                      Audit Stok Bahan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 5 cols: Financial Projection Hero Card */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
              <Card className="rounded-2xl border border-slate-300/80 bg-slate-100/70 shadow-sm overflow-hidden">
                <CardHeader className="p-5 pb-3.5 border-b border-slate-200/90 bg-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">
                        Preview Produksi
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Main Projected HPP / Unit Hero Box */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Proyeksi HPP Bahan / Unit
                    </span>
                    <span className="text-3xl font-black font-mono tracking-tight text-primary mt-1">
                      {variantBreakdowns.length > 1 ? (
                        <span className="text-base">HPP per Varian</span>
                      ) : (
                        <CurrencyText value={estimatedHppPerUnit} />
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {variantBreakdowns.length > 1
                        ? 'HPP tetap dihitung terpisah untuk masing-masing varian'
                        : `per 1 ${selectedProduct?.unit || 'pcs'} (HPP Bahan Baku FIFO)`}
                    </span>
                  </div>

                  {/* Per-Variant HPP & Selling Price Breakdown */}
                  <div className="space-y-2 rounded-xl border border-slate-200/90 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-700">
                      Estimasi HPP & Harga Jual per Varian
                    </p>
                    {variantBreakdowns.map(vb => (
                      <div
                        key={vb.key}
                        className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="text-slate-700 font-medium">
                          <span>{vb.productName}</span>
                          <span className="text-slate-400 font-mono ml-1.5">
                            ({vb.plannedQty} {vb.unit})
                          </span>
                        </div>
                        <div className="shrink-0 font-mono text-right">
                          <span className="font-semibold text-primary">
                            HPP: <CurrencyText value={vb.estimatedHpp} />/{vb.unit}
                          </span>
                          <span className="text-slate-500 ml-2">
                            · Jual: <CurrencyText value={vb.sellingPrice} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Metric Rows */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Target Produksi:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {variantBreakdowns.length > 1
                          ? `${variantBreakdowns.length} varian`
                          : `${effectiveQty} ${selectedProduct?.unit || 'pcs'}`}
                      </span>
                    </div>

                    {variantBreakdowns.length === 1 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Harga Jual / Unit:</span>
                        <span className="font-mono font-bold text-slate-900">
                          <CurrencyText value={sellingPrice} />
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Est. Total Biaya Bahan:</span>
                      <span className="font-mono font-bold text-slate-900">
                        <CurrencyText value={totalEstimatedRawCost} />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Est. Nilai Penjualan Kotor:</span>
                      <span className="font-mono font-bold text-slate-900">
                        <CurrencyText value={projectedRevenue} />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 bg-emerald-50 border border-emerald-200/70 px-3 rounded-xl text-emerald-800">
                      <span className="font-semibold text-xs text-emerald-900">
                        Proyeksi Margin Bahan:
                      </span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        {projectedMargin}%
                      </span>
                    </div>
                  </div>

                  {variantBreakdowns.some(
                    vb => vb.sellingPrice > 0 && vb.estimatedHpp > vb.sellingPrice,
                  ) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                      Harga jual saat ini lebih rendah dari proyeksi HPP bahan baku pada salah satu
                      varian.
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-1" />

                  {/* Submit CTA Button */}
                  <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={submitting || !canSubmitItems}
                    className="w-full h-11 rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Factory className="h-4 w-4" />
                    )}
                    <span>Simpan ke Antrian</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting || !canSubmitItems}
                    onClick={() => void handleSubmit(undefined, true)}
                    className="w-full h-9 rounded-xl text-xs font-semibold bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Simpan Draft
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancel}
                    className="w-full h-9 rounded-xl text-xs font-semibold bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Batal & Kembali
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-4 sticky bottom-4 shadow-lg">
        <p className="text-xs text-muted-foreground font-medium">
          Langkah {step + 1} dari {STEPS.length}
          {dirty && ' · Parameter belum dimulai'}
        </p>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            className="h-10 text-xs font-semibold flex-1 sm:flex-none"
            disabled={submitting}
            onClick={cancel}
          >
            Batal
          </Button>

          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-semibold flex-1 sm:flex-none"
              disabled={submitting}
              onClick={() => goTo(step - 1)}
            >
              Kembali
            </Button>
          )}

          {step < 2 ? (
            <Button
              type="button"
              className="h-10 text-xs font-semibold flex-1 sm:flex-none"
              disabled={submitting}
              onClick={next}
            >
              <span>Lanjut</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10 text-xs font-semibold flex-1 sm:flex-none"
              disabled={submitting || !canSubmitItems}
              onClick={() => handleSubmit()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Memulai...</span>
                </>
              ) : (
                <>
                  <Factory className="mr-2 h-4 w-4" />
                  <span>Simpan ke Antrian</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Leave Dialog */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keluar dari Form Produksi?</DialogTitle>
            <DialogDescription>
              Batch belum dimulai. Keluar sekarang akan membatalkan pengaturan batch yang sudah Anda
              isi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-semibold"
              onClick={() => setConfirmLeave(false)}
            >
              Lanjut Mengisi
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 text-xs font-semibold"
              onClick={leave}
            >
              Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
