const HOST_IMAGES = {
  cashier: "/images/ekatra-pricing-cashier-side-v2.webp",
  chef: "/images/ekatra-pricing-chef-side.webp",
}

export function PricingHost({ character }: { character: keyof typeof HOST_IMAGES }) {
  return (
    <picture aria-hidden="true" className={`pointer-events-none absolute top-1/2 z-10 hidden w-36 -translate-y-1/2 select-none lg:block xl:w-48 ${character === "cashier" ? "-left-28 xl:-left-40" : "-right-28 xl:-right-40"}`}>
      <source media="(min-width: 1024px)" srcSet={HOST_IMAGES[character]} />
      <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width={480} height={720} loading="lazy" decoding="async" className="block h-auto w-full" />
    </picture>
  )
}
