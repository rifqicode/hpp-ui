import type { MouseEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EkatraLogo, EkatraWordmark } from "@/components/brand/ekatra-logo"
import { APP_NAME, cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import "./public-mobile.css"

type PublicNavigationProps = {
  onSectionClick?: (event: MouseEvent<HTMLAnchorElement>, targetId: string) => void
}

export function PublicHeader({ onSectionClick }: PublicNavigationProps) {
  const isAuthenticated = Boolean(useAuthStore(state => state.token))
  const isContact = useLocation().pathname === "/hubungi-kami"
  return (
    <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2 sm:gap-2.5 group">
          <EkatraLogo
            className="h-6 w-8 sm:h-8 sm:w-12 transition-transform group-hover:scale-105"
          />
          <EkatraWordmark className="text-sm min-[360px]:text-base sm:text-2xl" />
        </Link>
        <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-600">
          <a
            href={onSectionClick ? "#fitur" : "/#fitur"}
            onClick={(e) => onSectionClick?.(e, "fitur")}
            className="inline-flex min-h-11 items-center hover:text-primary transition-colors cursor-pointer"
          >
            Fitur
          </a>
          <a
            href={onSectionClick ? "#alur-kerja" : "/#alur-kerja"}
            onClick={(e) => onSectionClick?.(e, "alur-kerja")}
            className="inline-flex min-h-11 items-center hover:text-primary transition-colors cursor-pointer"
          >
            Cara Kerja
          </a>
          <a
            href={onSectionClick ? "#pricing" : "/#pricing"}
            onClick={(e) => onSectionClick?.(e, "pricing")}
            className="inline-flex min-h-11 items-center hover:text-primary transition-colors cursor-pointer"
          >
            Harga Paket
          </a>
          <a
            href={onSectionClick ? "#faq" : "/#faq"}
            onClick={(e) => onSectionClick?.(e, "faq")}
            className="inline-flex min-h-11 items-center hover:text-primary transition-colors cursor-pointer"
          >
            Tanya jawab
          </a>
          <Link to="/hubungi-kami" aria-current={isContact ? "page" : undefined} className={cn("min-h-11 inline-flex items-center transition-colors hover:text-primary", isContact && "text-primary")}>
            Hubungi Kami
          </Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          {isAuthenticated ? (
            <Button asChild className="public-mobile-button public-mobile-button-header bg-primary hover:bg-primary/90 text-white shadow-sm font-medium text-xs sm:text-sm h-11 px-2 sm:px-4">
              <Link to="/dashboard" aria-label="Buka dashboard" className="flex items-center gap-2">
                <span>Buka Dashboard</span>
                <ArrowRight className="hidden sm:block size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="public-mobile-button public-mobile-button-header h-11 text-slate-700 hover:text-slate-900 font-medium text-xs sm:text-sm px-2 sm:px-4">
                <Link to="/login">Masuk</Link>
              </Button>
              <Button asChild className="public-mobile-button public-mobile-button-header bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 font-medium text-xs sm:text-sm h-11 px-2 sm:px-4">
                <Link to="/register" className="flex items-center gap-1.5">
                  <span>Mulai Gratis</span>
                  <ArrowRight className="hidden min-[360px]:block size-3.5" />
                </Link>
              </Button>
            </>
          )}


        </div>
      </div>
      <nav aria-label="Navigasi halaman" className="grid grid-cols-5 border-t border-slate-100 px-3 text-xs font-semibold text-slate-600 lg:hidden">
        {[
          { id: "alur-kerja", label: "Cara kerja" },
          { id: "fitur", label: "Fitur" },
          { id: "pricing", label: "Harga" },
          { id: "faq", label: "Bantuan" },
        ].map(({ id, label }) => (
          <a key={id} href={`${onSectionClick ? "" : "/"}#${id}`} onClick={(e) => onSectionClick?.(e, id)} className="flex min-h-11 py-1 text-[11px] sm:text-xs items-center justify-center rounded-md hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{label}</a>
        ))}
        <Link to="/hubungi-kami" aria-current={isContact ? "page" : undefined} className={cn("flex min-h-11 items-center justify-center rounded-md text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:text-xs", isContact ? "text-primary" : "hover:text-primary")}>Kontak</Link>
      </nav>
    </header>
  )
}

export function PublicFooter({ onSectionClick }: PublicNavigationProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <EkatraLogo
              darkMode
              className="h-8 w-12 sm:h-9 sm:w-14"
            />
            <EkatraWordmark darkMode className="text-2xl text-white" />
          </div>
          <p className="text-xs text-slate-400 text-center md:text-right max-w-md">
            Bantu hitung biaya menu, atur harga jual, catat stok bahan, dan lihat hasil penjualan usaha kuliner Anda.
          </p>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {APP_NAME}. Hak cipta dilindungi.</p>
          <div className="grid w-full max-w-sm grid-cols-3 gap-x-3 gap-y-1 sm:flex sm:w-auto sm:max-w-none sm:flex-wrap sm:gap-x-6 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:justify-center">
            <a
              href={onSectionClick ? "#fitur" : "/#fitur"}
              onClick={(e) => onSectionClick?.(e, "fitur")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Fitur
            </a>
            <a
              href={onSectionClick ? "#alur-kerja" : "/#alur-kerja"}
              onClick={(e) => onSectionClick?.(e, "alur-kerja")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Cara Kerja
            </a>
            <a
              href={onSectionClick ? "#pricing" : "/#pricing"}
              onClick={(e) => onSectionClick?.(e, "pricing")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Harga
            </a>
            <Link to="/hubungi-kami" className="hover:text-slate-300 transition-colors">Hubungi Kami</Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
