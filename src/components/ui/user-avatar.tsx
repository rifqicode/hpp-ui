import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface UserAvatarProps {
  src?: string | null
  name?: string
  className?: string
  fallbackClassName?: string
  size?: "sm" | "default" | "lg" | "xl"
}

// 7 sophisticated gradient presets for professional SaaS default avatars
const GRADIENT_PALETTES = [
  "from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-indigo-500/20",
  "from-blue-600 via-blue-500 to-indigo-600 text-white shadow-blue-500/20",
  "from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
  "from-violet-600 via-purple-500 to-fuchsia-600 text-white shadow-purple-500/20",
  "from-rose-600 via-pink-500 to-rose-600 text-white shadow-rose-500/20",
  "from-amber-600 via-amber-500 to-orange-600 text-white shadow-amber-500/20",
  "from-teal-600 via-cyan-500 to-blue-600 text-white shadow-teal-500/20",
]

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "U"
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "")
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getDeterministicGradient(name?: string): string {
  if (!name) return GRADIENT_PALETTES[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length
  return GRADIENT_PALETTES[index]
}

export function UserAvatar({
  src,
  name = "User",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = getInitials(name)
  const gradient = getDeterministicGradient(name)
  const hasValidSrc = Boolean(src && src.trim().length > 0)

  return (
    <Avatar
      className={cn(
        "relative overflow-hidden shrink-0 select-none border border-slate-200/80 shadow-xs",
        className
      )}
    >
      {hasValidSrc && (
        <AvatarImage
          src={src || undefined}
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br font-extrabold tracking-wider flex items-center justify-center shadow-inner",
          gradient,
          fallbackClassName
        )}
      >
        <span>{initials}</span>
      </AvatarFallback>
    </Avatar>
  )
}
