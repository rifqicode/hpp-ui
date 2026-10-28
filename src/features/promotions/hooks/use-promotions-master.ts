import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/hooks/use-permission';
import { useAuthStore } from '@/store/use-auth-store';
import { promotionService } from '../services/promotion-service';
import { formReadiness, inputFromPromotion, newPromotionInput, promotionError } from '../lib/promotion-form';
import type { PromotionListFilters } from '../lib/promotion-list';
import type { PendingPromotionAction, Promotion, PromotionEditor, PromotionInput } from '../types';

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePromotionsMaster(storeId: string, filters: Partial<PromotionListFilters> = {}) {
  const client = useQueryClient();
  const { can } = usePermission();
  const canRead = can('promotions:read');
  const canWrite = can('promotions:write');
  const canDelete = can('promotions:delete');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<PromotionEditor | null>(null);
  const [optionSearch, setOptionSearch] = useState('');
  const [optionPage, setOptionPage] = useState(1);
  const [pending, setPending] = useState<PendingPromotionAction | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Promotion | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const debouncedSearch = useDebounced(search);
  const debouncedOptions = useDebounced(optionSearch);
  const list = useQuery({
    queryKey: ['promotions', storeId, page, debouncedSearch, filters],
    queryFn: ({ signal }) => promotionService.list(storeId, page, debouncedSearch, signal, filters),
    enabled: canRead && Boolean(storeId), retry: false,
  });
  const options = useQuery({
    queryKey: ['promotion-options', storeId, optionPage, debouncedOptions],
    queryFn: ({ signal }) => promotionService.options(storeId, optionPage, debouncedOptions, signal),
    enabled: canRead && Boolean(editor), staleTime: 30_000, retry: false,
  });
  const serialized = editor ? JSON.stringify(editor.input) : '';
  const debouncedInput = useDebounced(serialized, 500);
  const readiness = editor ? formReadiness(editor.input) : '';
  const currentSimulation = serialized === debouncedInput;
  const simulationQuery = useQuery({
    queryKey: ['promotion-simulation', storeId, debouncedInput],
    queryFn: ({ signal }) => promotionService.simulate(storeId, JSON.parse(debouncedInput) as PromotionInput, signal),
    enabled: Boolean(editor && !editor.readOnly && canWrite && !readiness && currentSimulation),
    retry: false, staleTime: 0, gcTime: 0, refetchOnWindowFocus: false,
  });
  const simulation = editor?.readOnly ? editor.snapshot : currentSimulation && !readiness ? simulationQuery.data : undefined;
  const isCurrentStore = () => useAuthStore.getState().activeStoreId === storeId;

  function updateInput(input: PromotionInput) {
    setEditor(previous => previous ? { ...previous, input: { ...input, loss_leader_confirmed: false } } : null);
    setPending(null);
    setError('');
  }

  function closeEditor() {
    if (busyRef.current) return;
    setEditor(null); setPending(null); setError('');
  }

  function create() {
    if (!canWrite || busyRef.current) return;
    setEditor({ input: newPromotionInput(), readOnly: false });
    setOptionSearch(''); setOptionPage(1); setError(''); setSuccess('');
  }

  async function execute(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setSuccess('');
    try { await action(); }
    catch (failure) { if (isCurrentStore()) setError(promotionError(failure)); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function refresh(message: string) {
    await client.invalidateQueries({ queryKey: ['promotions', storeId] });
    if (isCurrentStore()) setSuccess(message);
  }

  async function open(promotion: Promotion, readOnly = !canWrite) {
    await execute(async () => {
      const latest = await promotionService.get(storeId, promotion.id);
      if (!isCurrentStore()) return;
      setEditor({ id: latest.id, input: inputFromPromotion(latest), readOnly, snapshot: latest.planning_snapshot });
      setOptionSearch(''); setOptionPage(1);
    });
  }

  async function persist(input: PromotionInput, id?: string) {
    await promotionService.save(storeId, input, id);
    if (!isCurrentStore()) return;
    setEditor(null); setPending(null);
    await refresh('Promosi berhasil disimpan.');
  }

  async function save() {
    if (!editor || editor.readOnly || !canWrite) return;
    if (!editor.input.name.trim()) { setError('Nama promosi wajib diisi.'); return; }
    if (readiness) { setError(readiness); return; }
    const snapshot = editor;
    await execute(async () => {
      const fresh = await promotionService.simulate(storeId, snapshot.input);
      if (!isCurrentStore()) return;
      if (snapshot.input.is_active && fresh.is_loss_leader) {
        setPending({ kind: 'save', id: snapshot.id, input: snapshot.input, simulation: fresh });
        return;
      }
      await persist(snapshot.input, snapshot.id);
    });
  }

  async function toggle(promotion: Promotion) {
    if (!canWrite) return;
    await execute(async () => {
      const latest = await promotionService.get(storeId, promotion.id);
      if (!isCurrentStore()) return;
      if (latest.version !== promotion.version) {
        await client.invalidateQueries({ queryKey: ['promotions', storeId] });
        throw new Error('Promosi telah berubah. Daftar diperbarui; periksa status terbaru sebelum melanjutkan.');
      }
      if (!latest.is_active) {
        const fresh = await promotionService.simulate(storeId, inputFromPromotion(latest));
        if (!isCurrentStore()) return;
        if (fresh.is_loss_leader) { setPending({ kind: 'activate', promotion: latest, simulation: fresh }); return; }
      }
      await promotionService.setActive(storeId, latest, !latest.is_active);
      await refresh(latest.is_active ? 'Promosi dinonaktifkan.' : 'Promosi diaktifkan.');
    });
  }

  async function confirmRisk() {
    if (!pending || !canWrite) return;
    const action = pending;
    await execute(async () => {
      if (action.kind === 'save') await persist({ ...action.input, loss_leader_confirmed: true }, action.id);
      else {
        await promotionService.setActive(storeId, action.promotion, true, true);
        setPending(null); await refresh('Promosi diaktifkan dengan konfirmasi defisit margin.');
      }
    });
  }

  async function archive() {
    if (!archiveTarget || !canDelete) return;
    const target = archiveTarget;
    await execute(async () => {
      await promotionService.archive(storeId, target.id);
      if (!isCurrentStore()) return;
      setArchiveTarget(null);
      if (list.data?.data.length === 1 && page > 1) setPage(page - 1);
      await refresh('Promosi berhasil diarsipkan.');
    });
  }

  return {
    canRead, canWrite, canDelete, list, search, page, editor, options, optionSearch, optionPage,
    pending, archiveTarget, busy, error, success, simulation, readiness,
    simulationLoading: Boolean(editor && !editor.readOnly && !readiness && (!currentSimulation || simulationQuery.isFetching)),
    simulationError: currentSimulation && !readiness && simulationQuery.error ? promotionError(simulationQuery.error) : '',
    setSearch: (value: string) => { setSearch(value); setPage(1); },
    setPage, setOptionPage,
    setOptionSearch: (value: string) => { setOptionSearch(value); setOptionPage(1); },
    updateInput, create, closeEditor, open, save, toggle, confirmRisk, archive,
    setArchiveTarget, dismissRisk: () => { if (!busyRef.current) setPending(null); },
    dismissArchive: () => { if (!busyRef.current) setArchiveTarget(null); },
    retrySimulation: () => simulationQuery.refetch(),
  };
}
