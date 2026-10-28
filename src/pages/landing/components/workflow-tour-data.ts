import { Boxes, ChefHat, HandPlatter, ReceiptText, TrendingUp } from "lucide-react"

export const WORKFLOW_TOUR_STEPS = [
  {
    name: "Kasir", icon: ReceiptText, x: 22, y: 62, panelX: "35%", panelY: "43%", path: "",
    heading: "Pesanan masuk lewat kasir.",
    summary: "Kasir mencatat 2 porsi nasi ayam dan pembayaran. Untuk menu yang dibuat saat dipesan, antrean produksi ikut dibuat.",
    description: "Kasir mencatat 2 porsi nasi ayam dan pembayarannya. Karena menu ini dibuat saat dipesan, catatan produksi ikut dibuat untuk dapur.",
    rows: [{ label: "Pesanan", value: "2 × nasi ayam" }, { label: "Harga jual", value: "Rp 25.000 / porsi" }],
    resultLabel: "Penjualan tercatat", result: "Rp 50.000", outcome: "Pesanan terhubung ke antrean produksi.",
  },
  {
    name: "Dapur", icon: ChefHat, x: 31, y: 26, panelX: "40%", panelY: "26%", path: "M22 62 C12 48 17 30 31 26",
    heading: "Dapur mulai menyiapkan pesanan.",
    summary: "Tim dapur mengambil pesanan dari antrean, lalu memasak sesuai menu, jumlah porsi, dan resep yang tercatat.",
    description: "Tim mengambil pesanan dari antrean produksi. Menu, jumlah porsi, dan resep yang terkait menjadi panduan saat memasak.",
    rows: [{ label: "Menu yang dibuat", value: "Nasi ayam" }, { label: "Target hasil", value: "2 porsi" }],
    resultLabel: "Status produksi", result: "Sedang dimasak", outcome: "Kasir dan dapur merujuk pesanan yang sama.",
  },
  {
    name: "Bahan & biaya", icon: Boxes, x: 57, y: 18, panelX: "31%", panelY: "31%", path: "M31 26 C38 16 46 12 57 18",
    heading: "Selesai memasak, stok dan biaya terhitung.",
    summary: "Produksi selesai: stok bahan berkurang. Biaya bahan dan produksi membentuk HPP aktual.",
    description: "Saat produksi diselesaikan, stok bahan berkurang sesuai pemakaian yang dicatat. Biaya bahan dan biaya produksi yang dimasukkan membentuk HPP aktual.",
    rows: [{ label: "Hasil masakan", value: "2 porsi nasi ayam" }, { label: "Biaya per porsi (HPP)", value: "Rp 12.000" }],
    resultLabel: "Biaya untuk 2 porsi", result: "Rp 24.000", outcome: "Stok bahan diperbarui dan biaya pesanan tercatat.",
  },
  {
    name: "Pesanan siap", icon: HandPlatter, x: 77, y: 63, panelX: "26%", panelY: "44%", path: "M57 18 C67 32 61 53 77 63",
    heading: "Makanan siap untuk pelanggan.",
    summary: "2 porsi siap disajikan langsung untuk pesanan pelanggan, tanpa menambah stok produk siap jual.",
    description: "Dua porsi yang selesai dimasak siap diserahkan. Pada alur dibuat saat dipesan ini, hasil masakan langsung untuk pelanggan, bukan menambah stok produk siap jual.",
    rows: [{ label: "Hasil produksi", value: "2 porsi siap diserahkan" }, { label: "Untuk", value: "Pesanan dari kasir tadi" }],
    resultLabel: "Pesanan pelanggan", result: "Siap disajikan", outcome: "Dari pesanan yang sama hingga makanan selesai dibuat.",
  },
  {
    name: "Laporan", icon: TrendingUp, x: 84, y: 30, panelX: "35%", panelY: "26%", path: "M77 63 C94 60 96 40 84 30",
    heading: "Pemilik bisa melihat hasilnya.",
    summary: "Penjualan dikurangi biaya produk terjual menghasilkan laba kotor. Ini belum dikurangi biaya usaha lain seperti sewa.",
    description: "Penjualan dan biaya produk yang terjual bisa ditelusuri. Selisihnya adalah laba kotor, sebelum dikurangi biaya usaha lain di luar HPP seperti sewa tempat.",
    rows: [{ label: "Penjualan", value: "Rp 50.000" }, { label: "Biaya produk terjual", value: "Rp 24.000" }],
    resultLabel: "Laba kotor pesanan ini", result: "Rp 26.000", outcome: "Tahu hasil penjualan dan biaya yang membentuk labanya.",
  },
] as const
