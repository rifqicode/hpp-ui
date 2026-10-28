import { SUBSCRIPTION_TIER_LABELS } from "@/features/subscription/types/subscription"
import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"
import { useSubscriptionGuards } from "@/features/subscription"
import { ChevronRight, Lock, Crown, Sprout, TrendingUp } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubItem, SidebarMenuSubButton, SidebarRail, useSidebar,
} from "@/components/ui/sidebar"
import { StoreDropdown } from "./store-dropdown"
import { OnboardingInvitation } from "@/features/onboarding/components/onboarding-entry"
import type { OnboardingData } from "@/features/onboarding/types"
import { useStoresQuery, useStorePermissionsQuery } from "@/features/settings/hooks/use-stores-query"
import { NAVIGATION, filterNavigation, getActiveNavigationIds, type NavigationItem } from "./sidebar-navigation"

interface NavigationBranchProps {
  item: NavigationItem
  depth: number
  activeIds: Set<string>
  openMenus: Record<string, boolean>
  toggleMenu: (id: string, currentlyOpen: boolean) => void
  canAccessFeature: ReturnType<typeof useSubscriptionGuards>["canAccessFeature"]
  onGatedClick: (event: React.MouseEvent, title: string) => void
  inheritedFeature?: NavigationItem["requiredFeature"]
}

function NavigationBranch({
  item, depth, activeIds, openMenus, toggleMenu, canAccessFeature, onGatedClick, inheritedFeature,
}: NavigationBranchProps) {
  const contentId = React.useId()
  const active = activeIds.has(item.id)
  const isOpen = openMenus[item.id] ?? active
  const feature = item.requiredFeature ?? inheritedFeature
  const isGated = feature ? !canAccessFeature(feature) : false
  const Icon = item.icon
  const Item = depth === 0 ? SidebarMenuItem : SidebarMenuSubItem
  const Button = depth === 0 ? SidebarMenuButton : SidebarMenuSubButton
  const label = (
    <>
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
    </>
  )
  const buttonClass = `w-full cursor-pointer text-left ${active ? "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary" : "text-muted-foreground hover:text-foreground"}`

  return (
    <Item>
      {item.children ? (
        <>
          <Button
            asChild
            isActive={active}
            className={buttonClass}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggleMenu(item.id, isOpen)}
            >
              {label}
              <ChevronRight aria-hidden="true" className={`size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`} />
            </button>
          </Button>
          <div
            id={contentId}
            className="sidebar-branch-content"
            data-state={isOpen ? "open" : "closed"}
            aria-hidden={!isOpen}
            inert={!isOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <SidebarMenuSub className="mx-2 mt-1 px-2">
                {item.children.map((child) => (
                  <NavigationBranch
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    activeIds={activeIds}
                    openMenus={openMenus}
                    toggleMenu={toggleMenu}
                    canAccessFeature={canAccessFeature}
                    onGatedClick={onGatedClick}
                    inheritedFeature={feature}
                  />
                ))}
              </SidebarMenuSub>
            </div>
          </div>
        </>
      ) : (
        <Button asChild isActive={active} className={buttonClass}>
          {isGated ? (
            <button type="button" onClick={(event) => onGatedClick(event, item.title)}>
              {label}
              <Lock className="size-3 shrink-0 text-amber-500/80" aria-label="Paket terkunci" />
            </button>
          ) : (
            <Link to={item.url!} aria-current={active ? "page" : undefined}>
              {label}
            </Link>
          )}
        </Button>
      )}
    </Item>
  )
}

export function SidebarMain({ onboardingData }: { onboardingData?: OnboardingData }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  const activeStoreId = useAuthStore((state) => state.activeStoreId)
  const { data: stores = [], isSuccess: isStoresSuccess } = useStoresQuery()
  const permissionsQuery = useStorePermissionsQuery(activeStoreId)
  const { canAccessFeature, usage, isLoading: isSubscriptionLoading } = useSubscriptionGuards()
  const [menuState, setMenuState] = React.useState<{ pathname: string; menus: Record<string, boolean> }>({ pathname: location.pathname, menus: {} })
  const openMenus = menuState.pathname === location.pathname ? menuState.menus : {}

  // Query data is scoped to the active store, including when revisiting a cached store.
  const permissions = permissionsQuery.isSuccess ? permissionsQuery.data.permissions : []
  const visibleNavigation = filterNavigation(NAVIGATION, (permission) => permissions.includes(permission))
  // Match against all routes so a hidden, more specific route cannot activate another menu.
  const activeIds = getActiveNavigationIds(NAVIGATION, location.pathname)

  React.useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [location.pathname, isMobile, setOpenMobile])

  React.useEffect(() => {
    if (isStoresSuccess && stores.length === 0) navigate("/setup-store")
  }, [isStoresSuccess, stores.length, navigate])

  const toggleMenu = (id: string, currentlyOpen: boolean) => {
    setMenuState({ pathname: location.pathname, menus: { ...openMenus, [id]: !currentlyOpen } })
  }

  const handleGatedClick = (event: React.MouseEvent, title: string) => {
    event.preventDefault()
    event.stopPropagation()
    window.dispatchEvent(
      new CustomEvent("open-upgrade-modal", {
        detail: {
          message: `Fitur "${title}" terkunci pada paket Anda saat ini. Silakan tingkatkan paket langganan Anda untuk membuka fitur ini.`,
          code: "FEATURE_LOCKED",
        },
      })
    )
  }

  const tier = usage?.effective_tier
  const TierIcon = tier === "MAX_GROWTH" ? Crown : tier === "GROWTH" ? TrendingUp : Sprout
  const tierLabel = usage ? SUBSCRIPTION_TIER_LABELS[usage.effective_tier] : isSubscriptionLoading ? "Memuat paket…" : "Lihat paket"

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-primary/20 bg-sidebar shadow-md">
      <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:p-2">
        <div className="rounded-2xl border border-sidebar-border bg-card shadow-sm group-data-[collapsible=icon]:rounded-lg">
          <StoreDropdown />
          <Link
            to="/subscription"
            data-tier={tier}
            aria-label={usage ? `Paket ${tierLabel}. ${tier === "FREE" ? "Upgrade paket" : "Kelola langganan"}` : "Lihat paket langganan"}
            aria-busy={isSubscriptionLoading}
            className="sidebar-membership group/membership flex min-h-14 items-center gap-2.5 rounded-b-2xl border-t px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-b-lg group-data-[collapsible=icon]:p-1"
          >
            <span className="sidebar-membership-emblem flex size-6 shrink-0 items-center justify-center rounded-md">
              <TierIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">{usage ? "Paket aktif" : "Langganan"}</span>
              <span className="block truncate text-xs font-semibold leading-4 text-sidebar-foreground">{tierLabel}</span>
            </span>
            <span className="sidebar-membership-action flex shrink-0 items-center gap-0.5 text-[11px] font-semibold group-data-[collapsible=icon]:hidden">
              {usage ? tier === "FREE" ? "Upgrade" : "Kelola" : "Lihat"}
              <ChevronRight className="size-3.5 transition-transform group-hover/membership:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <nav aria-label="Menu utama">
          {activeStoreId && permissionsQuery.isPending && (
            <p role="status" className="px-3 py-2 text-xs text-muted-foreground">Memuat akses menu...</p>
          )}
          {permissionsQuery.isError && (
            <div role="alert" className="px-3 py-2 text-xs text-muted-foreground">
              <p>Gagal memuat akses menu.</p>
              <button type="button" onClick={() => void permissionsQuery.refetch()} className="mt-1 rounded underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Coba lagi
              </button>
            </div>
          )}
          <SidebarMenu className="gap-1 py-2">
            {visibleNavigation.map((item) => (
              <NavigationBranch
                key={item.id}
                item={item}
                depth={0}
                activeIds={activeIds}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                canAccessFeature={canAccessFeature}
                onGatedClick={handleGatedClick}
              />
            ))}
          </SidebarMenu>
        </nav>
        <OnboardingInvitation data={onboardingData} />
      </SidebarContent>

      <SidebarFooter className="p-3 pt-1 text-center group-data-[collapsible=icon]:hidden">
        <p className="text-[11px] text-muted-foreground select-none">
          © {new Date().getFullYear()} Ekatra
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
