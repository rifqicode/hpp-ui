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
import { UserDropdown } from "./user-dropdown"
import { GracePeriodBanner, UpgradeModal } from "@/features/subscription"
import { SUBSCRIPTION_TIER_LABELS, type SubscriptionTier } from "@/features/subscription/types/subscription"
import { AIChatFloatingDrawer } from "@/features/ai-chat"
import { PaymentNotice } from '@/features/subscription/components/PaymentNotice'
import { SubscriptionWelcome } from '@/features/subscription/components/SubscriptionWelcome'
import { OnboardingGate } from '@/features/onboarding/components/onboarding-gate'
import type { OnboardingData } from '@/features/onboarding/types'

export function DashboardLayout() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace />
  return location.pathname === '/dashboard'
    ? <OnboardingGate>{(data) => <DashboardWorkspace onboardingData={data} />}</OnboardingGate>
    : <DashboardWorkspace />
}

function DashboardWorkspace({ onboardingData }: { onboardingData?: OnboardingData }) {
  const location = useLocation()
  const contentRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])
  const isFetching = useLoadingStore((state) => state.pending > 0)
  const [registrationTier] = React.useState<SubscriptionTier | undefined>(() => {
    const tier = sessionStorage.getItem('pending_upgrade_tier') || localStorage.getItem('pending_upgrade_tier')
    return tier === 'GROWTH' || tier === 'MAX_GROWTH' ? tier : undefined
  })
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(Boolean(registrationTier))
  const [upgradeReason, setUpgradeReason] = React.useState(registrationTier ? `Selesaikan pembayaran untuk mengaktifkan paket ${SUBSCRIPTION_TIER_LABELS[registrationTier]} akun Anda.` : '')
  const [initialSelectedTier, setInitialSelectedTier] = React.useState<SubscriptionTier | undefined>(registrationTier)

  React.useEffect(() => {
    // Check if user came from registration with a pending upgrade tier
    if (registrationTier) {
      sessionStorage.removeItem("pending_upgrade_tier")
      localStorage.removeItem("pending_upgrade_tier")
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
  }, [registrationTier])

  const menuTitle = getActiveMenuTitle(location.pathname)

  return (
    <TooltipProvider>
      <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
        <SidebarMain onboardingData={onboardingData} />
        <SidebarInset className="h-full min-h-0 min-w-0">
          <GracePeriodBanner
            onUpgradeClick={() => {
              setUpgradeReason("Paket langganan Anda sedang dalam masa tenggang. Perpanjang paket untuk mempertahankan akses penuh dan kuota Anda.")
              setIsUpgradeOpen(true)
            }}
          />
          <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-3 sm:px-4 backdrop-blur">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <SidebarTrigger className="h-9 w-9 rounded-lg border border-border/60 bg-card/60 text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors shrink-0 cursor-pointer" />
              <div className="h-4 w-px bg-border shrink-0" />
              <h1 title={menuTitle} className="text-sm font-semibold tracking-tight text-foreground sm:text-base truncate">
                {menuTitle}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <AIChatFloatingDrawer />
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </header>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <main ref={contentRef} className="flex-1 overflow-auto overscroll-contain p-3.5 sm:p-4 lg:p-6 w-full min-w-0">
              <div className="w-full min-w-0">
                {location.pathname !== '/subscription' && <div className="mb-4"><PaymentNotice compact /></div>}
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

          <SubscriptionWelcome />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
