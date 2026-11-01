import { useQuery } from '@tanstack/react-query';
import { usePermission } from '@/hooks/use-permission';
import { promotionService } from '../services/promotion-service';

export function usePromotionDetail(storeId: string, promotionId: string) {
  const { can } = usePermission();
  const canRead = can('promotions:read');
  const detail = useQuery({
    queryKey: ['promotion-detail', storeId, promotionId],
    queryFn: () => promotionService.get(storeId, promotionId),
    enabled: Boolean(storeId && promotionId && canRead),
    retry: false,
  });

  return { detail, canRead, canWrite: can('promotions:write') };
}
