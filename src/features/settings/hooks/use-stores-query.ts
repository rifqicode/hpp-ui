import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/features/settings/services/settings-service";
import { useAuthStore } from "@/store/use-auth-store";
import type { StoreInfo } from "@/features/settings/types";

export const storeKeys = {
  all: ["stores"] as const,
  permissions: (id: string) => ["store-permissions", id] as const,
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
  return useQuery({
    queryKey: storeKeys.permissions(storeId || ""),
    queryFn: () => settingsService.getStorePermissions(storeId!),
    enabled: !!storeId,
  });
}
