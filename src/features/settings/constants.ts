export const PERMISSION_GROUP_INFO: Record<string, { label: string; desc: string }> = {
  MENU: {
    label: "Akses Halaman & Modul Menu",
    desc: "Wewenang membuka halaman navigasi utama sistem",
  },
  STOCKS: {
    label: "Operasional Stok & Gudang",
    desc: "Melihat, menambah, mengubah, dan stock opname bahan baku",
  },
  RECIPES: {
    label: "Formula Resep & Biaya HPP",
    desc: "Menyusun resep produksi dan menentukan target margin laba",
  },
  PRODUCTS: {
    label: "Katalog Produk Siap Jual",
    desc: "Mengelola produk etalase dan harga jual konsumen",
  },
  SALES: {
    label: "Kasir & Transaksi POS",
    desc: "Pencatatan kasir, riwayat pesanan, dan pembatalan nota (void)",
  },
  STAFF: {
    label: "Manajemen Tim & Hak Akses",
    desc: "Mengundang staf dan mendelegasikan wewenang akses",
  },
  SETTINGS: {
    label: "Pengaturan Toko & Outlet",
    desc: "Mengubah identitas toko, cabang, dan preferensi perhitungan",
  },
}
