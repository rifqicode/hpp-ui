import { useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';
import { usePermission } from '@/hooks/use-permission';
import { useProductionBatchActions } from '../components/production-batch-actions';
import { productionBatchService, type ProductionHead } from '../services/production-batch-service';
import { mapBackendLogToProductionBatch } from '../services/production-service';
import { productionCosts } from '../services/production-batch-presentation';

export function useProductionBatchDetail() {
  const { batchId = '' } = useParams();
  const location = useLocation();
  const previous: unknown = location.state?.returnTo;
  const returnTo =
    typeof previous === 'string' && /^\/production\/batches(?:\?|$)/.test(previous)
      ? previous
      : '/production/batches';
  const [searchParams, setSearchParams] = useSearchParams();
  const storeId = useAuthStore(state => state.activeStoreId);
  const { can } = usePermission();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['production', storeId, 'head', batchId],
    queryFn: () => productionBatchService.get(batchId),
    enabled: Boolean(storeId && batchId),
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function updated(head: ProductionHead) {
    client.setQueryData(['production', storeId, 'head', batchId], head);
    setEditing(false);
    setError('');
    void client.invalidateQueries({ queryKey: ['production'] });
    void client.invalidateQueries({ queryKey: ['subscription-usage'] });
  }
  const actions = useProductionBatchActions(updated);
  async function reopen() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      updated(await productionBatchService.draft(batchId));
      setEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft belum berhasil dibuka.');
    } finally {
      setBusy(false);
    }
  }
  const head = query.data;
  const logs = head?.logs ?? [];
  const activeIndex = Math.max(
    0,
    logs.findIndex(log => log.id === searchParams.get('variant')),
  );
  const activeLog = logs[activeIndex];
  const activeBatch = activeLog ? mapBackendLogToProductionBatch(activeLog) : undefined;
  const included = logs.filter(log => !['CANCELLED', 'VOID'].includes(log.status));
  const summary = included.reduce(
    (total, log) => {
      const costs = productionCosts(mapBackendLogToProductionBatch(log));
      return {
        material: total.material + costs.material,
        overhead: total.overhead + costs.overhead,
        total: total.total + costs.total,
      };
    },
    { material: 0, overhead: 0, total: 0 },
  );
  function selectLog(id: string) {
    setSearchParams(
      current => {
        const next = new URLSearchParams(current);
        next.set('variant', id);
        return next;
      },
      { replace: true, state: location.state },
    );
  }
  return {
    query,
    head,
    returnTo,
    editing,
    setEditing,
    error,
    busy,
    updated,
    reopen,
    actions,
    canWrite: can('production:write'),
    activeIndex,
    activeLog,
    activeBatch,
    selectLog,
    summary,
    running: logs.filter(log => log.status === 'IN_PROGRESS'),
    queued: logs.filter(log => log.status === 'QUEUED' || log.status === 'DRAFT'),
    pending: logs.some(log => ['DRAFT', 'QUEUED', 'IN_PROGRESS'].includes(log.status)),
  };
}
