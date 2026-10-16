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
import type { SubscriptionTier } from "@/features/subscription/types/subscription"
import { AIChatFloatingDrawer } from "@/features/ai-chat"

export function DashboardLayout() {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const isFetching = useLoadingStore((state) => state.pending > 0)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState<boolean>(false)
  const [upgradeReason, setUpgradeReason] = React.useState<string>("")
  const [initialSelectedTier, setInitialSelectedTier] = React.useState<SubscriptionTier | undefined>()

  React.useEffect(() => {
    // Check if user came from registration with a pending upgrade tier
    const pendingTier = sessionStorage.getItem("pending_upgrade_tier") || localStorage.getItem("pending_upgrade_tier")
    if (pendingTier && (pendingTier === "GROWTH" || pendingTier === "MAX_GROWTH")) {
      sessionStorage.removeItem("pending_upgrade_tier")
      localStorage.removeItem("pending_upgrade_tier")
      setInitialSelectedTier(pendingTier as SubscriptionTier)
      setUpgradeReason(`Selesaikan pembayaran untuk mengaktifkan paket ${pendingTier} akun Anda.`)
      setIsUpgradeOpen(true)
    }

    const handleOpenUpgrade = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string; tier?: SubscriptionTier }>
      setUpgradeReason(customEvent.detail?.message || "Tingkatkan paket untuk melanjutkan aktivitas.")
      if (customEvent.detail?.tier) {
        setInitialSelectedTier(customEvent.detail.tier)
      }
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
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <GracePeriodBanner
            onUpgradeClick={() => {
              setUpgradeReason("Paket langganan Anda sedang dalam masa tenggang. Perpanjang paket untuk mempertahankan akses penuh dan kuota Anda.")
              setIsUpgradeOpen(true)
            }}
          />
          <div className="sticky top-0 z-10 flex h-13 items-center justify-between gap-2 border-b bg-background/95 px-3 sm:px-4 backdrop-blur">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <SidebarTrigger className="h-8 w-8 rounded-lg border border-border/60 bg-card/60 text-foreground hover:bg-accent hover:text-accent-foreground shadow-2xs transition-all shrink-0 cursor-pointer" />
              <div className="h-4 w-px bg-border shrink-0" />
              <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base truncate">
                {menuTitle}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <StoreDropdown />
              <NotificationDropdown />
            </div>
          </div>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 lg:p-6 w-full min-w-0">
              <div className="w-full min-w-0">
                <Outlet />
              </div>
            </main>
            <LoadingOverlay visible={isFetching} />
          </div>

          <UpgradeModal
            isOpen={isUpgradeOpen}
            onClose={() => {
              setIsUpgradeOpen(false)
              setInitialSelectedTier(undefined)
            }}
            reason={upgradeReason}
            initialSelectedTier={initialSelectedTier}
          />

          <AIChatFloatingDrawer />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
