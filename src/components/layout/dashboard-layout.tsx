import { Outlet, Navigate } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarMain } from "./sidebar-main"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/use-auth-store"
import { useLoadingStore } from "@/store/use-loading-store"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

export function DashboardLayout() {
  const token = useAuthStore((state) => state.token)
  const isFetching = useLoadingStore((state) => state.pending > 0)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <SidebarMain />
        <SidebarInset>
          <div className="md:hidden sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="flex h-12 items-center px-4">
              <SidebarTrigger className="text-foreground hover:bg-muted" />
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

        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
