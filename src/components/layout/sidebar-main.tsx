import { SUBSCRIPTION_TIER_LABELS } from "@/features/subscription/types/subscription"
import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"
import { useSubscriptionGuards } from "@/features/subscription"
import { Factory, ChevronRight, Lock, Crown } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubItem, SidebarMenuSubButton, SidebarRail, useSidebar,
} from "@/components/ui/sidebar"
import { StoreDropdown } from "./store-dropdown"
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

export function SidebarMain() {
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

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-primary/20 bg-sidebar shadow-md">
      <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:p-2">
        <div className="rounded-xl border border-sidebar-border/70 bg-card/60 p-1.5 shadow-2xs transition-all group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none flex flex-col gap-1">
          <StoreDropdown />

          {/* Hairline Divider */}
          <div className="h-px bg-sidebar-border/60 mx-1 group-data-[collapsible=icon]:hidden" />

          <Link
            to="/subscription"
            className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 text-xs hover:bg-sidebar-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:hidden"
            aria-label="Lihat paket langganan"
          >
            <span className="text-muted-foreground">Paket aktif</span>
            <span
              data-tier={usage?.effective_tier}
              className="subscription-tier inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground"
            >
              {usage?.effective_tier === "MAX_GROWTH" && <Crown className="size-3 shrink-0" aria-hidden="true" />}
              {usage ? SUBSCRIPTION_TIER_LABELS[usage.effective_tier] : isSubscriptionLoading ? "Memuat..." : "Tidak tersedia"}
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
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/20 border border-sidebar-border/40 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <Factory className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-xs tracking-tight text-foreground">HPP Manager</span>
            <span className="text-[10px] text-muted-foreground">v1.0 • Bakery Edition</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
