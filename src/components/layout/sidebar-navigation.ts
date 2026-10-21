import type { ComponentType } from "react"
import {
  LayoutDashboard, Factory, Package, ShoppingCart, Settings, Users,
  Calculator, History, Store, ClipboardList, Layers, CreditCard,
} from "lucide-react"
import type { SubscriptionFeatures } from "@/features/subscription"

export interface NavigationItem {
  id: string
  title: string
  url?: string
  activePaths?: string[]
  icon?: ComponentType<{ className?: string }>
  permission?: string
  requiredFeature?: keyof SubscriptionFeatures
  children?: NavigationItem[]
}

export const NAVIGATION: NavigationItem[] = [
  {
    id: "main", title: "Main", icon: LayoutDashboard,
    children: [
      { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "menu:dashboard" },
    ],
  },
  {
    id: "inventory", title: "Inventory", icon: Package,
    children: [
      { id: "stocks", title: "Bahan Baku", url: "/inventory/stocks", activePaths: ["/inventory/purchase", "/inventory/movements"], icon: Package, permission: "menu:stocks" },
      { id: "suppliers", title: "Suppliers", url: "/inventory/suppliers", icon: Users, permission: "menu:stocks" },
      { id: "purchase", title: "Purchase", url: "/inventory/purchase-orders", icon: ClipboardList, permission: "stocks:create" },
    ],
  },
  {
    id: "production", title: "Production", icon: Factory,
    children: [
      { id: "batches", title: "Production", url: "/production/batches", icon: History, permission: "menu:recipes" },
      { id: "overheads", title: "Biaya Overhead", url: "/production/overheads", icon: Layers, permission: "menu:recipes" },
      { id: "products", title: "Produk", url: "/production/products", activePaths: ["/production/recipes"], icon: Factory, permission: "menu:recipes" },
      {
        id: "hpp", title: "HPP Calculator", icon: Calculator, permission: "menu:recipes", requiredFeature: "production_analytics",
        children: [
          { id: "recipe-simulation", title: "Simulasi Resep Baru", url: "/production/hpp/recipe-simulation", requiredFeature: "production_analytics" },
          { id: "production-simulation", title: "Simulasi Produksi & Restock", url: "/production/hpp/production-simulation", requiredFeature: "production_analytics" },
        ],
      },
    ],
  },
  {
    id: "order", title: "Order", icon: ShoppingCart,
    children: [
      { id: "pos", title: "POS", url: "/sales/pos", icon: ShoppingCart, permission: "menu:pos" },
      { id: "transactions", title: "Transactions", url: "/sales/history", icon: History, permission: "orders:read" },
      { id: "customers", title: "Customers", url: "/sales/customers", icon: Users, permission: "orders:read" },
    ],
  },
  {
    id: "administration", title: "Administration", icon: Settings,
    children: [
      { id: "subscription", title: "Subscription", url: "/subscription", icon: CreditCard },
      { id: "store-settings", title: "Store Settings", url: "/settings/store", icon: Store, permission: "menu:settings" },
      { id: "account-settings", title: "Account Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function filterNavigation(items: NavigationItem[], can: (permission: string) => boolean): NavigationItem[] {
  return items.flatMap((item) => {
    if (item.permission && !can(item.permission)) return []
    if (!item.children) return [item]
    const children = filterNavigation(item.children, can)
    return children.length ? [{ ...item, children }] : []
  })
}

function matchesPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + "/")
}

export function getActiveNavigationIds(items: NavigationItem[], pathname: string): Set<string> {
  const path = pathname.replace(/\/+$/, "") || "/"
  let bestMatch: NavigationItem[] = []
  let bestLength = -1
  function visit(nodes: NavigationItem[], parents: NavigationItem[]) {
    for (const item of nodes) {
      const branch = [...parents, item]
      if (item.children) visit(item.children, branch)
      if (!item.url) continue
      for (const candidate of [item.url, ...(item.activePaths ?? [])]) {
        if (matchesPath(path, candidate) && candidate.length > bestLength) {
          bestMatch = branch
          bestLength = candidate.length
        }
      }
    }
  }
  visit(items, [])
  return new Set(bestMatch.map((item) => item.id))
}
