import type { FeatureGuidanceConfig } from '../types';

/**
 * Feature Guidance UI Flag
 * Set to false to disable guidance overlays, tours, and prompts across the UI without removing code.
 */
export const GUIDANCE_UI_ENABLED = import.meta.env.VITE_ENABLE_STORE_GUIDANCE === 'true';

export const GUIDANCE_REGISTRY: Record<string, FeatureGuidanceConfig> = {
  first_product: {
    key: 'first_product',
    title: 'Kenali Biaya HPP & Buat Produk Pertama',
    description: 'Pahami relasi bahan baku dan margin keuntungan produk.',
    route: '/onboarding',
    steps: [],
  },
  stock: {
    key: 'stock',
    title: 'Bahan Baku & Stok Gudang',
    description: 'Kelola persediaan bahan baku dan catat acuan harga beli terkini.',
    route: '/inventory/stocks',
    steps: [
      {
        target: '[data-guidance="stock-table"]',
        title: 'Daftar Stok Bahan Baku',
        content: 'Pantau sisa kuantitas stok, acuan harga pokok, dan peringatan stok menipis di tabel ini.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="add-stock-btn"]',
        title: 'Tambah Bahan Baku Baru',
        content: 'Klik tombol ini untuk membuka formulir bahan baku baru.',
        placement: 'left',
        advanceOn: { type: 'click' },
      },
      {
        target: '[data-guidance="stock-create-modal"]',
        title: 'Lengkapi Formulir Bahan Baku',
        content: 'Isi nama bahan, satuan dasar (unit), dan metode inventaris (FIFO/FEFO), lalu klik simpan.',
        placement: 'right',
        advanceOn: { type: 'custom-event', event: 'guidance-task-success' },
      },
    ],
  },
  store_profile: {
    key: 'store_profile',
    title: 'Profil Toko & Informasi Outlet',
    description: 'Lengkapi identitas outlet, nomor kontak operasional, dan alamat fisik toko.',
    route: '/settings/store?tab=profile',
    steps: [
      {
        target: '[data-guidance="store-name"]',
        title: 'Nama Toko & Outlet',
        content: 'Nama toko akan muncul pada kop nota belanja kasir, pesanan pembelian, dan laporan laba rugi.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="store-contact"]',
        title: 'Kontak & Alamat Outlet',
        content: 'Isi nomor WhatsApp dan alamat gerai agar memudahkan koordinasi serta dicetak di struk nota.',
        placement: 'top',
      },
      {
        target: '[data-guidance="save-profile-btn"]',
        title: 'Simpan Perubahan Toko',
        content: 'Simpan perubahan profil Anda untuk memperbarui data outlet secara langsung.',
        placement: 'left',
        advanceOn: { type: 'click' },
      },
    ],
  },
  payment_config: {
    key: 'payment_config',
    title: 'Metode Pembayaran QRIS & Bank',
    description: 'Aktifkan penerimaan pembayaran kasir via QRIS, transfer bank, dan tunai.',
    route: '/settings/store?tab=payment',
    steps: [
      {
        target: '[data-guidance="payment-qris"]',
        title: 'Aktifkan QRIS Toko',
        content: 'Aktifkan QRIS statis dan unggah gambar kode QR toko agar kasir dapat menerima e-wallet & m-banking.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="payment-bank"]',
        title: 'Tambah Rekening Transfer Bank',
        content: 'Daftarkan nomor rekening bank toko untuk mempermudah pelanggan saat memilih bayar non-tunai.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="save-payment-btn"]',
        title: 'Simpan Konfigurasi Pembayaran',
        content: 'Terapkan metode pembayaran aktif yang langsung tersedia saat bertransaksi di POS kasir.',
        placement: 'left',
        advanceOn: { type: 'click' },
      },
    ],
  },
  receipt_config: {
    key: 'receipt_config',
    title: 'Pengaturan Struk Kasir',
    description: 'Kustomisasi ukuran kertas thermal, header, dan footer nota belanja pelanggan.',
    route: '/settings/store?tab=receipt',
    steps: [
      {
        target: '[data-guidance="paper-size"]',
        title: 'Ukuran Kertas Thermal',
        content: 'Pilih format kertas printer Anda: 58mm untuk printer mini/mPOS atau 80mm untuk printer desktop POS.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="footer-text"]',
        title: 'Pesan Footer Nota',
        content: 'Tuliskan ucapan terima kasih, nomor kontak layanan, atau akun sosial media toko Anda.',
        placement: 'top',
      },
      {
        target: '[data-guidance="save-receipt-btn"]',
        title: 'Simpan Format Struk',
        content: 'Simpan pengaturan format struk Anda. Desain ini langsung diterapkan saat kasir mencetak nota transaksi.',
        placement: 'left',
        advanceOn: { type: 'click' },
      },
    ],
  },
  production: {
    key: 'production',
    title: 'Catat Batch Produksi & Masak',
    description: 'Kelola alur masak dan pantau pengurangan stok bahan baku otomatis berdasarkan resep.',
    route: '/production/batches',
    steps: [
      {
        target: '[data-guidance="production-view-tabs"]',
        title: 'Riwayat & Monitoring Batch Produksi',
        content: 'Pantau status batch produksi aktif, kartu Kanban proses masak, dan riwayat pesanan selesai.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="new-batch-btn"]',
        title: 'Catat Produksi Baru',
        content: 'Mulai proses produksi baru dengan memilih varian produk, menentukan jumlah porsi, dan mengecek ketersediaan bahan.',
        placement: 'left',
        advanceOn: { type: 'click' },
      },
    ],
  },
  pos: {
    key: 'pos',
    title: 'Kasir & Transaksi Penjualan',
    description: 'Catat penjualan produk, hitung margin kotor seketika, dan cetak struk belanja.',
    route: '/sales/pos',
    steps: [
      {
        target: '[data-guidance="pos-catalog"]',
        title: 'Katalog Produk Siap Jual',
        content: 'Klik kartu produk atau gunakan pencarian untuk memasukkan item ke dalam keranjang pesanan pelanggan.',
        placement: 'bottom',
      },
      {
        target: '[data-guidance="pos-checkout"]',
        title: 'Periksa Pesanan & Bayar',
        content: 'Periksa keranjang belanja pelanggan lalu klik tombol Bayar Sekarang untuk membuka dialog kasir.',
        placement: 'top',
        advanceOn: { type: 'click' },
      },
      {
        target: '[data-guidance="pos-payment-modal"]',
        title: 'Selesaikan Pembayaran Transaksi',
        content: 'Pilih metode pembayaran (Tunai, QRIS, atau Transfer), masukkan nominal, lalu konfirmasi pembayaran.',
        placement: 'right',
        advanceOn: { type: 'custom-event', event: 'guidance-task-success' },
      },
    ],
  },
};

export const ORDERED_GUIDANCE_KEYS = [
  'first_product',
  'stock',
  'store_profile',
  'payment_config',
  'receipt_config',
  'production',
  'pos',
];
