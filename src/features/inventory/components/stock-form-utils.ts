export const stockSelectClass =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 transition-colors"

export const stockNumber = (value: number | string) =>
  Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 4 })
