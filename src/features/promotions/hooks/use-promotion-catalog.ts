import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';
import { usePermission } from '@/hooks/use-permission';
import { promotionService } from '../services/promotion-service';

export function usePromotionCatalog(enabled: boolean) {
  const storeId = useAuthStore(state => state.activeStoreId);
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const settling = search.trim() !== debouncedSearch;
  const query = useQuery({
    queryKey: ['promotion-options', storeId, page, debouncedSearch],
    queryFn: ({ signal }) => promotionService.options(storeId!, page, debouncedSearch, signal),
    enabled: enabled && Boolean(storeId) && can('promotions:read') && !settling,
    staleTime: 30_000,
    retry: false,
  });
  return {
    query,
    search,
    page,
    setPage,
    settling,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
  };
}
