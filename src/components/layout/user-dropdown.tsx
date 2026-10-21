import { Link, useNavigate } from "react-router-dom"
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react"
import { useAuthStore } from "@/store/use-auth-store"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserDropdown() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const userName = user?.name || "Pengguna"
  const userEmail = user?.email || ""
  const userAvatar = user?.avatar

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Menu pengguna: ${userName}`}
          className="h-10 max-w-56 gap-2 rounded-lg px-1.5 sm:px-2"
        >
          <UserAvatar
            src={userAvatar}
            name={userName}
            className="size-8 shrink-0 rounded-lg border border-border"
            fallbackClassName="rounded-lg text-xs"
          />
          <span className="hidden min-w-0 truncate text-xs font-semibold sm:block">{userName}</span>
          <ChevronsUpDown className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 max-w-[calc(100vw-1rem)] rounded-xl p-1.5 shadow-xl border-border"
        side="bottom"
        align="end"
        sideOffset={6}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-2 py-2 text-left text-xs">
            <UserAvatar
              src={userAvatar}
              name={userName}
              className="size-8 rounded-lg border border-border shadow-xs shrink-0"
              fallbackClassName="rounded-lg text-xs"
            />
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-semibold">{userName}</span>
              <span className="truncate text-[10px] text-muted-foreground">{userEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 text-xs">
            <Link to="/settings?tab=profile">
              <User className="size-3.5 text-muted-foreground" />
              <span>Profil Pengguna</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 text-xs">
            <Link to="/settings?tab=security">
              <Settings className="size-3.5 text-muted-foreground" />
              <span>Keamanan & Sesi</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout()
            navigate("/login")
          }}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2.5 text-xs"
        >
          <LogOut className="size-3.5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
