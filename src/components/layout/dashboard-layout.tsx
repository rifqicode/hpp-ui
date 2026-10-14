import * as React from "react"
import { Outlet, Navigate, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarMain } from "./sidebar-main"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/use-auth-store"
import { useLoadingStore } from "@/store/use-loading-store"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { getActiveMenuTitle } from "@/lib/page-info"

import { NotificationDropdown } from "./notification-dropdown"
import { StoreDropdown } from "./store-dropdown"
import { GracePeriodBanner, UpgradeModal } from "@/features/subscription"

export function DashboardLayout() {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const isFetching = useLoadingStore((state) => state.pending > 0)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState<boolean>(false)
  const [upgradeReason, setUpgradeReason] = React.useState<string>("")

  React.useEffect(() => {
    const handleOpenUpgrade = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>
      setUpgradeReason(customEvent.detail?.message || "Tingkatkan paket untuk melanjutkan aktivitas.")
      setIsUpgradeOpen(true)
    }

    window.addEventListener("open-upgrade-modal", handleOpenUpgrade)
    return () => window.removeEventListener("open-upgrade-modal", handleOpenUpgrade)
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const menuTitle = getActiveMenuTitle(location.pathname)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <SidebarMain />
        <SidebarInset>
          <GracePeriodBanner
            onUpgradeClick={() => {
              setUpgradeReason("Paket langganan Anda sedang dalam masa tenggang. Perpanjang paket untuk mempertahankan akses penuh dan kuota Anda.")
              setIsUpgradeOpen(true)
            }}
          />
          <div className="sticky top-0 z-10 flex h-13 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-foreground hover:bg-muted shrink-0" />
              <div className="h-4 w-px bg-border shrink-0" />
              <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base truncate">
                {menuTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <StoreDropdown />
              <NotificationDropdown />
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full">
              <div className="w-full">
                <Outlet />
              </div>
            </main>
            <LoadingOverlay visible={isFetching} />
          </div>

          <UpgradeModal
            isOpen={isUpgradeOpen}
            onClose={() => setIsUpgradeOpen(false)}
            reason={upgradeReason}
          />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
