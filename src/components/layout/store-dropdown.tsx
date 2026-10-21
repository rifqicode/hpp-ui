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
import { useSidebar } from "@/components/ui/sidebar"

export function StoreDropdown() {
  const { isMobile } = useSidebar()
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
          className="w-full min-w-0 min-h-11 flex items-center gap-2 rounded-lg border border-sidebar-primary bg-sidebar-primary px-2 py-2 text-xs text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 data-[state=open]:bg-sidebar-primary/90 cursor-pointer select-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          title={`Toko Aktif: ${displayName}`}
          aria-label={`Toko aktif: ${displayName}. Pilih toko`}
        >
          <Store className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {displayName}
          </span>
          <ChevronsUpDown className="size-3 opacity-70 shrink-0 group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 max-w-[calc(100vw-1rem)] bg-sidebar text-sidebar-foreground p-1.5 shadow-xl border-sidebar-border"
        side={isMobile ? "bottom" : "right"}
        align="start"
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
