import { Link } from "react-router-dom"
import { ChefHat, ClipboardList, Package, ShoppingBag } from "lucide-react"
import { EkatraLogo, EkatraWordmark } from "@/components/brand/ekatra-logo"
import { APP_NAME } from "@/lib/utils"

const STEPS = [
  { label: "Bahan", icon: Package },
  { label: "Produk", icon: ClipboardList },
  { label: "Produksi", icon: ChefHat },
  { label: "Penjualan", icon: ShoppingBag },
]

const PAGE_MESSAGES = {
  login: null,
  register: null,
  verification: "Satu langkah lagi untuk mulai mencatat usaha Anda.",
}

export function AuthBrandPanel({ page }: { page: keyof typeof PAGE_MESSAGES }) {
  return (
    <aside className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 p-10 text-white lg:col-span-4 lg:flex lg:flex-col xl:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-violet-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-10 text-center">
        <Link to="/" aria-label={`${APP_NAME}, beranda`} className="mb-6 flex h-28 w-40 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950">
          <EkatraLogo darkMode className="h-28 w-40" />
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight xl:text-4xl"><EkatraWordmark darkMode /></h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300">Satu Alur, Usaha Teratur.</p>

        {PAGE_MESSAGES[page] && <p className="mt-10 max-w-xs text-base font-medium leading-relaxed text-slate-200">{PAGE_MESSAGES[page]}</p>}

        <div className="relative mt-7 w-full">
          <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-5 h-px bg-slate-700" />
          <ol aria-label="Alur usaha dari bahan hingga penjualan" className="relative grid grid-cols-4 gap-2">
            {STEPS.map(({ label, icon: Icon }, index) => (
              <li key={label} className="flex min-w-0 flex-col items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-xl border ${index === STEPS.length - 1 ? "border-emerald-400/40 bg-slate-950 text-emerald-300" : "border-slate-700 bg-slate-950 text-indigo-300"}`}>
                  <Icon aria-hidden="true" className="size-5" strokeWidth={1.7} />
                </div>
                <span className="text-xs font-medium text-slate-300">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-6 max-w-xs text-sm leading-relaxed text-slate-400">Dari biaya bahan sampai hasil jualan, semua tercatat dalam satu alur.</p>
      </div>

      <p className="relative z-10 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} {APP_NAME}</p>
    </aside>
  )
}
