/**
 * Maps the current location pathname to a human-readable active menu title.
 */
export function getActiveMenuTitle(pathname: string): string {
  // Normalize trailing slash
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  if (path === '/dashboard') {
    return 'Dashboard';
  }

  // Inventory
  if (path === '/inventory/stocks') {
    return 'Bahan Baku';
  }
  if (path.startsWith('/inventory/stocks/')) {
    return 'Detail Bahan Baku';
  }
  if (path === '/inventory/purchase/new') {
    return 'Catat Belanja Masuk';
  }
  if (path === '/inventory/movements/new') {
    return 'Koreksi Mutasi';
  }
  if (path === '/inventory/suppliers') {
    return 'Suppliers';
  }
  if (path.startsWith('/inventory/suppliers/')) {
    return 'Detail Supplier';
  }
  if (path === '/inventory/purchase-orders') {
    return 'Purchase';
  }
  if (path === '/inventory/purchase-orders/new') {
    return 'Buat PO Baru';
  }
  if (path.startsWith('/inventory/purchase-orders/')) {
    return 'Detail Purchase Order';
  }

  // Production
  if (path === '/production/products') {
    return 'Produk';
  }
  if (path === '/production/products/new') {
    return 'Tambah Produk';
  }
  if (path.startsWith('/production/products/')) {
    return 'Detail Produk';
  }
  if (path === '/production/batches') {
    return 'Production';
  }
  if (path === '/production/batches/new') {
    return 'Mulai Batch';
  }
  if (path.startsWith('/production/batches/')) {
    return 'Detail Batch';
  }
  if (path === '/production/hpp' || path === '/production/hpp/recipe-simulation' || path === '/hpp') {
    return 'Simulasi Resep Baru';
  }
  if (path === '/production/hpp/production-simulation') {
    return 'Simulasi Produksi & Restock';
  }
  if (path === '/production/overheads') {
    return 'Biaya Overhead';
  }

  // Sales
  if (path === '/sales/pos') {
    return 'Kasir (POS)';
  }
  if (path === '/sales/history') {
    return 'Riwayat Transaksi';
  }
  if (path === '/sales/customers') {
    return 'Pelanggan';
  }

  // Settings
  if (path === '/settings/store') {
    return 'Pengaturan Toko';
  }
  if (path === '/settings/role') {
    return 'Manajemen Role';
  }
  if (path.startsWith('/settings')) {
    return 'Pengaturan Akun';
  }

  // Subscription
  if (path === '/subscription' || path.startsWith('/subscription/')) {
    return 'Paket & Langganan';
  }

  // Notifications
  if (path === '/notifications' || path.startsWith('/notifications/')) {
    return 'Notifikasi';
  }

  return 'HPP Manager';
}
