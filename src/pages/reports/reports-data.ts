export const products = [
  { name: 'Croissant Butter', category: 'Pastry', price: 24000, cost: 13200, previousCost: 12000, daily: [18, 22, 25, 19, 28, 35, 31], note: 'Harga butter naik. Tinjau pembelian sebelum mengubah harga jual.' },
  { name: 'Pain au Chocolat', category: 'Pastry', price: 28000, cost: 14500, previousCost: 14200, daily: [12, 15, 14, 18, 20, 24, 22], note: 'Kontribusi laba kuat. Pertahankan ketersediaan saat akhir pekan.' },
  { name: 'Cinnamon Roll', category: 'Bakery', price: 22000, cost: 8500, previousCost: 8200, daily: [8, 10, 9, 12, 14, 18, 16], note: 'Margin tinggi. Coba tawarkan sebagai pasangan minuman.' },
  { name: 'Sourdough', category: 'Bakery', price: 45000, cost: 21000, previousCost: 20500, daily: [4, 5, 3, 6, 5, 9, 7], note: 'Sisa barang jadi masih tinggi. Tinjau jumlah produksi harian.' },
  { name: 'Iced Latte', category: 'Minuman', price: 26000, cost: 9000, previousCost: 8800, daily: [16, 19, 22, 20, 25, 33, 28], note: 'Penjualan naik di akhir pekan. Siapkan susu sesuai kebutuhan.' },
  { name: 'Cookies Box', category: 'Bakery', price: 65000, cost: 42000, previousCost: 38000, daily: [3, 4, 2, 5, 4, 7, 6], note: 'Margin di bawah target contoh 40%. Evaluasi kemasan dan bahan.' },
]
export const batches = [
  { date: '17 Okt', name: 'Croissant Butter', batch: 'B-1017-01', target: 50, good: 46, cost: 660000, reason: '4 pcs gagal mengembang' },
  { date: '18 Okt', name: 'Pain au Chocolat', batch: 'B-1018-01', target: 40, good: 39, cost: 565500, reason: '1 pcs bentuk tidak sesuai' },
  { date: '19 Okt', name: 'Cinnamon Roll', batch: 'B-1019-01', target: 40, good: 40, cost: 340000, reason: 'Tidak ada waste' },
  { date: '20 Okt', name: 'Sourdough', batch: 'B-1020-01', target: 30, good: 27, cost: 567000, reason: '3 pcs overproof' },
  { date: '21 Okt', name: 'Cookies Box', batch: 'B-1021-01', target: 25, good: 24, cost: 1008000, reason: '1 box tidak lolos kualitas' },
  { date: '22 Okt', name: 'Croissant Butter', batch: 'B-1022-01', target: 60, good: 58, cost: 765600, reason: '2 pcs gosong' },
]
export const inventory = [
  { name: 'Butter unsalted', stock: 8, unit: 'kg', usage: 2, cost: 160000, daysToExpiry: 12, incoming: 10, lead: 3 },
  { name: 'Susu segar', stock: 12, unit: 'liter', usage: 5, cost: 22000, daysToExpiry: 2, incoming: 0, lead: 1 },
  { name: 'Tepung protein tinggi', stock: 45, unit: 'kg', usage: 6, cost: 15000, daysToExpiry: 90, incoming: 0, lead: 2 },
  { name: 'Dark chocolate', stock: 5, unit: 'kg', usage: 0.7, cost: 125000, daysToExpiry: 45, incoming: 0, lead: 4 },
  { name: 'Kemasan cookies', stock: 120, unit: 'pcs', usage: 4, cost: 6500, daysToExpiry: null, incoming: 0, lead: 3 },
]
export const suppliers = [
  { name: 'Dairy Nusantara', material: 'Butter unsalted', unit: 'kg', price: 160000, old: 148000, ordered: 40, received: 40, ontime: 4, deliveries: 5 },
  { name: 'Bahan Kue Makmur', material: 'Butter unsalted', unit: 'kg', price: 165000, old: 163000, ordered: 20, received: 20, ontime: 5, deliveries: 5 },
  { name: 'Tepung Sentosa', material: 'Tepung protein tinggi', unit: 'kg', price: 15000, old: 14500, ordered: 100, received: 95, ontime: 3, deliveries: 4 },
  { name: 'Fresh Milk Lokal', material: 'Susu segar', unit: 'liter', price: 22000, old: 22000, ordered: 80, received: 80, ontime: 8, deliveries: 8 },
]

export const productSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function productWeeks(product: typeof products[number]) {
  return [0.7, 0.82, 0.9, 1].map((factor, index) => {
    const daily = product.daily.map(qty => Math.round(qty * factor))
    const cost = index === 3 ? product.cost : product.previousCost
    const quantity = daily.reduce((sum, qty) => sum + qty, 0)
    return { label: ['26 Sep–2 Okt', '3–9 Okt', '10–16 Okt', '17–23 Okt'][index], start: ['2026-09-26', '2026-10-03', '2026-10-10', '2026-10-17'][index], daily, cost, quantity, revenue: quantity * product.price, cogs: quantity * cost, profit: quantity * (product.price - cost) }
  })
}
