import "./hero-visual.css"

const VIEWS = ["cashier", "kitchen"] as const

export function HeroVisual() {
  return (
    <div
      role="img"
      aria-label="Ilustrasi kasir dan dapur Ekatra POS: pencatatan pesanan, pembayaran, produksi, dan bahan baku"
      className="relative grid w-full max-w-2xl overflow-hidden"
    >
      {VIEWS.map((view, index) => (
        <img
          key={view}
          src={`/images/ekatra-hero-${view}.webp`}
          srcSet={`/images/ekatra-hero-${view}-mobile.webp 640w, /images/ekatra-hero-${view}.webp 1280w`}
          sizes="(min-width: 1280px) 608px, (min-width: 1024px) calc(50vw - 48px), (min-width: 768px) 672px, calc(100vw - 32px)"
          alt=""
          width={1280}
          height={854}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
          className={`hero-slide-${view} pointer-events-none col-start-1 row-start-1 block h-auto w-full rounded-2xl sm:rounded-3xl`}
        />
      ))}
    </div>
  )
}
