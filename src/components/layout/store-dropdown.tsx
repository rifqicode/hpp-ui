import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Store, Check, ChevronsUpDown, Settings, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { settingsService } from "@/features/settings/services/settings-service"
import { useStoresQuery, storeKeys } from "@/features/settings/hooks/use-stores-query"
import type { StoreInfo } from "@/features/settings/types"
import { useAuthStore } from "@/store/use-auth-store"

export function StoreDropdown() {
  const queryClient = useQueryClient()
  const { data: stores = [] } = useStoresQuery()
  const activeStoreId = useAuthStore((state) => state.activeStoreId)
  const activeStoreName = useAuthStore((state) => state.activeStoreName)

  async function handleStoreChange(store: StoreInfo) {
    if (store.id === activeStoreId) return
    try {
      await settingsService.switchStore(store.id)
      useAuthStore.getState().setActiveStoreId(store.id)
      useAuthStore.getState().setActiveStoreName(store.name)
      await settingsService.getStorePermissions(store.id)
      await queryClient.invalidateQueries({ queryKey: storeKeys.all })
      window.location.reload()
    } catch (err) {
      console.error("Failed to switch store:", err)
    }
  }

  const currentStore = stores.find((s) => s.id === activeStoreId)
  const displayName = currentStore?.name || activeStoreName || "Toko Utama"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border border-border/80 bg-muted/60 hover:bg-muted/80 px-2.5 py-1 text-xs rounded-full flex items-center gap-1.5 shadow-2xs cursor-pointer select-none transition-colors outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          title={`Toko Aktif: ${displayName}`}
        >
          <Store className="size-3.5 text-primary shrink-0" />
          <span className="font-medium truncate max-w-[120px] sm:max-w-[180px] text-foreground">
            {displayName}
          </span>
          <span className="relative flex size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <ChevronsUpDown className="size-3 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 p-1.5 shadow-xl border-border"
        align="end"
        sideOffset={6}
      >
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          Pilih Toko
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {stores.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Tidak ada data toko
            </div>
          ) : (
            stores.map((store) => {
              const isSelected = store.id === activeStoreId
              return (
                <DropdownMenuItem
                  key={store.id}
                  onClick={() => handleStoreChange(store)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <div
                    className={`flex size-7 items-center justify-center rounded-md border shadow-2xs shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <Store className="size-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {store.name}
                    </span>
                    {(store.category || store.location) && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {[store.category, store.location]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="ml-auto size-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer">
          <Link to="/settings/store" className="flex items-center gap-2.5 w-full">
            <Settings className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs">Pengaturan Toko</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer">
          <Link to="/settings/store?tab=stores" className="flex items-center gap-2.5 w-full text-primary font-medium">
            <Plus className="size-3.5 text-primary shrink-0" />
            <span className="text-xs">Tambah Toko Baru</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
