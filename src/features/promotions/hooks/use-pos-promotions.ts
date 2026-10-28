import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';
import { usePermission } from '@/hooks/use-permission';
import { salesService } from '@/features/sales/services/sales-service';
import type { CartItem, CreateSaleInput } from '@/features/sales/types';
import { posPromotionService } from '../services/pos-promotion-service';
import { promotionError } from '../lib/promotion-form';
import type { POSPromotion, PromotionPreviewRequest } from '../types/pos';

export function usePOSPromotions(cart: CartItem[], customerPhone: string) {
  const storeId = useAuthStore(state => state.activeStoreId);
  const { can } = usePermission();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [template, setTemplate] = useState<POSPromotion | null>(null);
  const [rewardSelections, setRewardSelections] = useState<Record<string, string[]>>({});
  const client = useQueryClient();
  const request: PromotionPreviewRequest = {
    items: cart.map(item => ({ variant_id: item.product.id, quantity: String(item.quantity), modifier_option_ids: item.modifiers.map(option => option.id).sort() })),
    customer_phone: customerPhone.trim(),
  };
  const basketKey = JSON.stringify(request);
  const selectedRequest: PromotionPreviewRequest = {
    ...request, promotion_id: selectedId || undefined,
    reward_selections: Object.keys(rewardSelections).sort().map(id => ({ variant_id: id, modifier_option_ids: [...rewardSelections[id]].sort() })),
  };
  const selectionKey = JSON.stringify(selectedRequest);
  const hasCart = cart.length > 0;
  const permitted = can('orders:create');
  const candidates = useQuery({
    queryKey: ['pos-promotions', storeId, basketKey],
    queryFn: ({ signal }) => posPromotionService.preview(storeId!, JSON.parse(basketKey) as PromotionPreviewRequest, signal),
    enabled: Boolean(storeId && permitted && hasCart && open), retry: false, refetchOnWindowFocus: true,
  });
  const selectedQuery = useQuery({
    queryKey: ['pos-promotion-selection', storeId, selectionKey],
    queryFn: ({ signal }) => posPromotionService.preview(storeId!, JSON.parse(selectionKey) as PromotionPreviewRequest, signal),
    enabled: Boolean(storeId && permitted && hasCart && selectedId), retry: false, refetchInterval: 15_000,
  });
  const candidate = hasCart && permitted && selectedId ? selectedQuery.data?.find(promotion => promotion.id === selectedId) : undefined;
  const applied = candidate?.eligible && !selectedQuery.isFetching ? candidate : undefined;
  const rewards = applied?.lines.filter(line => line.is_reward_item) || [];
  const configurationRewards = selectedId ? (candidate?.lines || (template?.id === selectedId ? template.lines : [])).filter(line => line.is_reward_item) : [];
  const paidLines = new Map(applied?.lines.filter(line => !line.is_reward_item).map(line => [line.source_index, line]) || []);
  const ready = !selectedId || Boolean(applied && !applied.needs_configuration && !selectedQuery.error);
  const error = selectedId ? selectedQuery.error ? promotionError(selectedQuery.error) : candidate && !candidate.eligible ? candidate.reason || 'Promosi tidak memenuhi syarat.' : '' : '';

  function clear() { setSelectedId(null); setSelectedName(''); setTemplate(null); setRewardSelections({}); }
  function choose(promotion: POSPromotion) {
    if (!promotion.eligible) return;
    setSelectedId(promotion.id); setSelectedName(promotion.name); setRewardSelections({});
    setTemplate(promotion);
    if (!promotion.lines.some(line => line.is_reward_item && line.modifier_groups?.length)) setOpen(false);
  }
  function configureReward(variantId: string, optionIds: string[]) {
    setRewardSelections(previous => ({ ...previous, [variantId]: optionIds }));
  }
  async function submit(input: CreateSaleInput) {
    if (!storeId || useAuthStore.getState().activeStoreId !== storeId) throw new Error('Toko aktif berubah. Periksa keranjang sebelum membayar.');
    if (!ready) throw new Error('Promosi sedang divalidasi atau belum memenuhi syarat.');
    try {
      const sale = await salesService.createSale({ ...input, storeId, promotionId: selectedId || undefined, rewardSelections: selectedId ? selectedRequest.reward_selections : undefined });
      clear(); return sale;
    } catch (failure) {
      void client.invalidateQueries({ queryKey: ['pos-promotions', storeId] });
      void client.invalidateQueries({ queryKey: ['pos-promotion-selection', storeId] });
      throw failure;
    }
  }
  return {
    open, setOpen, candidates, selectedId, selectedName, applied, candidate, rewards, configurationRewards, paidLines, ready, error, rewardSelections,
    validating: Boolean(selectedId && selectedQuery.isFetching), permitted, clear, choose, configureReward, submit,
    refresh: () => { void candidates.refetch(); if (selectedId) void selectedQuery.refetch(); },
  };
}
