import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/features/settings/services/settings-service";
import { useAuthStore } from "@/store/use-auth-store";
import type { StoreInfo } from "@/features/settings/types";

export const storeKeys = {
  all: ["stores"] as const,
  permissions: (id: string, userId?: string) => ["store-permissions", id, userId] as const,
};

export function useStoresQuery() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  const query = useQuery<StoreInfo[]>({
    queryKey: storeKeys.all,
    queryFn: () => settingsService.getStoresList(),
  });

  const stores = query.data;

  useEffect(() => {
    if (stores && stores.length > 0 && !activeStoreId) {
      const firstStore = stores[0];
      useAuthStore.getState().setActiveStoreId(firstStore.id);
      useAuthStore.getState().setActiveStoreName(firstStore.name);
    }
  }, [stores, activeStoreId]);

  return query;
}

export function useStorePermissionsQuery(storeId?: string | null) {
  const userId = useAuthStore((state) => state.user?.id);
  const query = useQuery({
    queryKey: storeKeys.permissions(storeId || "", userId),
    queryFn: () => settingsService.getStorePermissions(storeId!),
    enabled: !!storeId && !!userId,
  });

  useEffect(() => {
    const state = useAuthStore.getState();
    if (query.isSuccess && state.activeStoreId === storeId && state.user?.id === userId) {
      state.setPermissions(query.data.permissions);
    }
  }, [query.isSuccess, query.data, storeId, userId]);

  return query;
}
