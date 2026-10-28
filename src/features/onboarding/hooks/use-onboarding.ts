import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '../services/onboarding-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { CreateProductInput, Product } from '@/features/recipes/types';
import { newProductForm } from '@/features/recipes/lib/product-form';
import { productInput } from '@/features/recipes/services/recipe-service';
import { materialUnitCost } from '../lib/material-unit-cost';
import { formatNumber } from '@/lib/number-format';
import type { MaterialDraft, OnboardingAction, OnboardingData, OnboardingDraft, OnboardingMaterial } from '../types';

export function newMaterial(): MaterialDraft { return { key: crypto.randomUUID(), stockId: '', name: '', baseUnit: 'g', price: '', packageQuantity: '' }; }
function newDraft(): OnboardingDraft {
  return { materials: [newMaterial()], product: { key: crypto.randomUUID(), existingProductId: '', builderStep: 0, builderVariantIndex: 0, form: newProductForm() } };
}
function restoreDraft(data: OnboardingData): OnboardingDraft {
  const initial = newDraft();
  const reachedSteps = Array.from({ length: data.state?.status === 'COMPLETED' ? 4 : Math.max(0, (data.state?.step ?? 1) - 1) }, (_, i) => i + 1);
  const completedSteps = [...new Set([...reachedSteps, ...(data.state?.draft.completedSteps ?? [])])].filter(step => Number.isInteger(step) && step >= 1 && step <= 4);
  const saved = data.state?.draft.product;
  const form = saved?.form?.variants?.length ? saved.form : data.product ? productInput(data.product) : initial.product.form;
  return { completedSteps, materials: data.state?.draft.materials ?? initial.materials, product: { key: saved?.key ?? initial.product.key, existingProductId: saved?.existingProductId ?? '', builderStep: saved?.builderStep ?? 0, builderVariantIndex: saved?.builderVariantIndex ?? 0, form } };
}
function completeStep(draft: OnboardingDraft, step: number): OnboardingDraft {
  return { ...draft, completedSteps: [...new Set([...(draft.completedSteps ?? []), step])] };
}
const errorMessage = (err: unknown) => err instanceof Error ? err.message : 'Penyimpanan gagal. Coba lagi.';

export function useOnboardingEntry() {
  const { activeStoreId, user, token } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eligible = Boolean(token && activeStoreId && user && user.account_type !== 'STAFF' && (user.role === 'OWNER' || user.role === 'STORE_OWNER'));
  const query = useQuery({
    queryKey: ['onboarding', user?.id, activeStoreId],
    queryFn: ({ signal }) => onboardingService.get(activeStoreId!, signal),
    enabled: eligible,
    retry: false, staleTime: 30_000,
  });
  const needsOnboarding = Boolean(
    eligible &&
    query.data?.should_start &&
    !query.data.dismissed &&
    query.data.state?.status !== 'SKIPPED' &&
    query.data.state?.status !== 'COMPLETED' &&
    !params.has('skipOnboarding')
  );
  const shouldRedirect = needsOnboarding && !query.isFetching;
  useEffect(() => { if (shouldRedirect) navigate('/onboarding', { replace: true }); }, [shouldRedirect, navigate]);
  return {
    ...query,
    data: eligible ? query.data : undefined,
    shouldRedirect,
    isChecking: eligible && !params.has('skipOnboarding') && (query.isPending || (needsOnboarding && query.isFetching)),
  };
}

export function useOnboarding(storeId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft>(newDraft);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<OnboardingMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [simulationPrice, setSimulationPrice] = useState('');
  const [resultVariantId, setResultVariantId] = useState('');
  const revision = useRef(0);
  const running = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const accept = useCallback((next: OnboardingData) => {
    revision.current = next.state?.revision ?? 0;
    setData(previous => ({ ...next, product: next.product ?? previous?.product }));
  }, []);
  const load = useCallback(() => {
    requestController.current?.abort();
    const controller = new AbortController(); requestController.current = controller;
    return onboardingService.get(storeId, controller.signal).then(async result => {
      if (controller.signal.aborted) return;
      if (result.dismissed || result.state?.status === 'SKIPPED') { navigate('/dashboard', { replace: true }); return; }
      const [stocks, catalog] = await Promise.all([onboardingService.materials(storeId, controller.signal), onboardingService.products(storeId, controller.signal)]);
      let current = result;
      if (!current.state) {
        try { current = await onboardingService.save(storeId, 0, 1, restoreDraft(current), 'start'); }
        catch (err) {
          const recovered = await onboardingService.get(storeId, controller.signal);
          if (!recovered.state) throw err;
          current = recovered;
        }
      }
      if (controller.signal.aborted) return;
      if (current.dismissed || current.state?.status === 'SKIPPED') { navigate('/dashboard', { replace: true }); return; }
      setError(''); accept(current); setDraft(restoreDraft(current)); setStep(current.state?.step ?? 1); setMaterials(stocks); setProducts(catalog);
      const selected = current.product?.variants.find(v => v.isActive && v.isDefault);
      setResultVariantId(selected?.id ?? ''); setSimulationPrice(String(selected?.sellingPrice || ''));
    }).catch((err: unknown) => { if (!controller.signal.aborted) setError(errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [storeId, accept, navigate]);
  useEffect(() => { void load(); return () => requestController.current?.abort(); }, [load]);
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  async function save(current: OnboardingDraft, target: number, action: OnboardingAction = 'save') {
    const result = await onboardingService.save(storeId, revision.current, target, current, action);
    accept(result); return result;
  }
  async function run(work: () => Promise<void>) {
    if (running.current) return;
    running.current = true; setBusy(true); setError('');
    try { await work(); }
    catch (err) { setError(errorMessage(err)); }
    finally { running.current = false; setBusy(false); }
  }
  function updateMaterial(index: number, patch: Partial<MaterialDraft>) {
    setDraft(current => ({ ...current, materials: current.materials.map((m, i) => i === index ? { ...m, ...patch, key: crypto.randomUUID() } : m) }));
  }
  const updateProductForm = useCallback((change: SetStateAction<CreateProductInput>) => {
    setDraft(current => ({ ...current, product: { ...current.product, key: crypto.randomUUID(), form: typeof change === 'function' ? change(current.product.form) : change } }));
  }, []);
  const updateBuilderStep = useCallback((builderStep: number) => {
    setDraft(current => ({ ...current, product: { ...current.product, builderStep } }));
  }, []);
  async function continueStep() {
    if (!formRef.current?.reportValidity()) return;
    await run(async () => {
      if (step === 1) {
        const current = completeStep(draft, 1);
        await save(current, 2, data?.state ? 'save' : 'start'); setDraft(current); setStep(2);
      } else if (step === 2) {
        const current: OnboardingDraft = { ...draft, materials: draft.materials.map(m => ({ ...m })) };
        const pending = current.materials.filter(m => m.savedKey !== m.key && (m.name.trim() || m.price || m.packageQuantity));
        if (!pending.length && !materials.length) throw new Error('Tambahkan setidaknya satu bahan baku untuk produk Anda.');
        if (pending.some(m => !m.name.trim() || Number(m.price) <= 0 || Number(m.packageQuantity) <= 0)) throw new Error('Lengkapi nama, harga total, dan jumlah setiap bahan.');
        // Persist operation keys before mutations so retrying a lost response stays idempotent.
        await save(current, 2);
        for (const row of pending) {
          const result = await onboardingService.saveMaterial(storeId, row);
          accept(result); row.stockId = result.stock.id; row.savedKey = row.key;
          setDraft({ ...current, materials: current.materials.map(m => ({ ...m })) });
          setMaterials(previous => [...previous.filter(m => m.id !== result.stock.id), { ...result.stock, cost_per_unit: result.stock.reference_unit_cost }]);
          await save(current, 2);
        }
        if (pending.length) {
          await queryClient.invalidateQueries({ queryKey: ['recipe-materials', storeId] });
          await queryClient.invalidateQueries({ queryKey: ['stocks'] });
        }
        const next = completeStep(current, 2);
        await save(next, 3); setDraft(next); setStep(3);
      } else if (step === 4) {
        const result = await save(completeStep(draft, 4), 4, 'complete');
        queryClient.setQueriesData({ queryKey: ['onboarding'] }, { ...result, should_start: false });
        await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
        navigate('/dashboard?welcome=1');
      }
    });
  }
  async function skipOnboarding() {
    await run(async () => {
      const result = await save(draft, step, 'skip');
      queryClient.setQueriesData({ queryKey: ['onboarding'] }, { ...result, dismissed: true, should_start: false });
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      navigate('/dashboard');
    });
  }
  async function goBack(target: number) {
    await run(async () => {
      const current = target === 3 && data?.state?.product_id ? { ...draft, product: { ...draft.product, key: crypto.randomUUID() } } : draft;
      await save(current, target); setDraft(current); setStep(target);
    });
  }
  function selectProduct(id: string) {
    const selected = products.find(p => p.id === id);
    setDraft(current => ({ ...current, product: { key: crypto.randomUUID(), existingProductId: selected?.id ?? '', builderStep: 0, builderVariantIndex: 0, form: selected ? productInput(selected) : data?.product ? productInput(data.product) : newProductForm() } }));
  }
  async function saveProductForm(form: CreateProductInput): Promise<Product> {
    if (running.current) throw new Error('Penyimpanan masih berjalan.');
    running.current = true; setBusy(true); setError('');
    try {
      const current = { ...draft, product: { ...draft.product, form } };
      await save(current, 3);
      const response = await onboardingService.saveProduct(storeId, current, data?.state?.product_id);
      if (!response.product) throw new Error('Produk tersimpan belum dapat dibaca. Muat ulang progres.');
      const next = completeStep({ ...current, product: { ...current.product, form: productInput(response.product) } }, 3);
      accept(response); setDraft(next); setStep(4);
      const selected = response.product.variants.find(v => v.isActive && v.isDefault);
      setResultVariantId(selected?.id ?? ''); setSimulationPrice(String(selected?.sellingPrice || ''));
      try { await save(next, 4); } catch (err) { setError(errorMessage(err)); }
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['stocks'] });
      return response.product;
    } finally { running.current = false; setBusy(false); }
  }
  async function useExistingProduct() {
    try { await saveProductForm(draft.product.form); } catch (err) { setError(errorMessage(err)); }
  }
  async function addMissingMaterial(builderVariantIndex: number) {
    await run(async () => {
      const current = { ...draft, product: { ...draft.product, builderStep: 1, builderVariantIndex } };
      await save(current, 2); setDraft(current); setStep(2);
    });
  }
  function selectResultVariant(id: string) {
    const selected = data?.product?.variants.find(variant => variant.id === id && variant.isActive);
    if (!selected) return;
    setResultVariantId(id); setSimulationPrice(String(selected.sellingPrice || ''));
  }
  function addMaterial() { setDraft(current => ({ ...current, materials: [...current.materials, newMaterial()] })); }
  function removeMaterial(index: number) { setDraft(current => ({ ...current, materials: current.materials.filter((_, i) => i !== index) })); }
  const resultVariants = data?.product?.variants.filter(variant => variant.isActive) ?? [];
  const variant = resultVariants.find(variant => variant.id === resultVariantId) ?? resultVariants.find(variant => variant.isDefault) ?? resultVariants[0];
  const materialUnitCosts = draft.materials.map(material => {
    const cost = materialUnitCost(material.price, material.packageQuantity);
    return cost === null ? null : `Rp${formatNumber(cost, { allowDecimal: true, maxDecimals: 4 })} / ${material.baseUnit}`;
  });
  const price = Number(simulationPrice);
  const cost = variant?.estimatedHpp ?? 0;
  const result = { variant, cost, price, profit: price - cost, margin: price > 0 ? (price - cost) / price * 100 : null };
  const completedSteps = data?.state?.status === 'COMPLETED' ? [1, 2, 3, 4] : draft.completedSteps ?? [];
  return { data, draft, step, completedSteps, loading, busy, error, materials, materialUnitCosts, products, simulationPrice, setSimulationPrice, result, resultVariants, selectResultVariant, formRef, headingRef, load, updateMaterial, updateProductForm, updateBuilderStep, saveProductForm, useExistingProduct, addMissingMaterial, continueStep, skipOnboarding, goBack, selectProduct, addMaterial, removeMaterial };
}
