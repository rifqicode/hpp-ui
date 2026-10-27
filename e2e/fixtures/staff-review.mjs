export default async function setupStaffReview(page, root = '/home/rifqicode/project/hpp/hpp-ui/dist') {
  const origin = 'https://staff-preview.invalid';
  const store = { id: 'staff-review-store', name: 'Kopi Senja', staff_login_code: 'kopi-senja-123456789abc', category: 'Cafe & Coffee Shop', location: 'Jakarta', status: 'online' };
  const owner = { id: 'owner', name: 'Pemilik Uji', email: 'owner@example.invalid', role: 'OWNER', account_type: 'OWNER' };
  const permissions = ['menu:dashboard', 'menu:settings', 'menu:staff', 'staff:invite', 'staff:manage'];
  const staff = [
    { id: 'owner-membership', user_id: owner.id, name: owner.name, email: owner.email, role: 'OWNER', status: 'active' },
    { id: 'staff-membership', user_id: 'staff-user', name: 'Budi', email: '', username: 'budi@' + store.staff_login_code, role: 'STAFF', status: 'active' },
  ];
  await page.unrouteAll({ behavior: 'wait' });
  await page.route(origin + '/**', async route => {
    const url = new URL(route.request().url());
    const resource = url.pathname.startsWith('/assets/') ? url.pathname : '/index.html';
    const contentType = resource.endsWith('.js') ? 'text/javascript' : resource.endsWith('.css') ? 'text/css' : resource.endsWith('.woff2') ? 'font/woff2' : 'text/html';
    await route.fulfill({ path: root + resource, contentType });
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/api')[1];
    const method = request.method();
    const headers = { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'Content-Type,Authorization,X-Store-ID', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (method === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    let data = [];
    if (path === '/store') data = store;
    else if (path === '/stores') data = [store];
    else if (path === '/auth/me') data = { user: owner, token: 'staff-preview-token' };
    else if (path === '/permissions/me') data = { permissions, role: 'OWNER' };
    else if (path === '/roles') data = [{ id: 'cashier-role', name: 'STORE_CASHIER', is_system: true }, { id: 'owner-role', name: 'STORE_OWNER', is_system: true }];
    else if (path === '/staff') data = staff;
    else if (path === '/staff/invite') {
      const input = request.postDataJSON();
      if (input.username === 'taken') { await route.fulfill({ status: 409, headers, json: { success: false, message: 'Username sudah dipakai di toko ini' } }); return; }
      data = { id: 'created-membership', user_id: 'created-staff', name: input.name, email: '', username: input.username + '@' + store.staff_login_code, role: 'STAFF', status: 'active' };
      staff.push(data);
    } else if (path?.endsWith('/password')) data = null;
    else if (path === '/subscription/usage') {
      const quota = { current: 2, limit: 100, remaining: 98, is_unlimited: false };
      data = { tier: 'MAX_GROWTH', subscription_status: 'ACTIVE', is_grace_period: false, is_trial: false, quotas: { products: quota, stocks: quota, stores: quota, staff: quota, batches: quota }, features: {} };
    }
    await route.fulfill({ status: 200, headers, json: { success: true, data } });
  });
  await page.addInitScript(({ owner, store }) => {
    localStorage.setItem('token', 'staff-preview-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: owner, token: 'staff-preview-token', activeStoreId: store.id, activeStoreName: store.name, permissions: [] }, version: 0 }));
  }, { owner, store });
  await page.goto(origin + '/settings/store?tab=staff');
  await page.getByRole('button', { name: 'Tambah Staf Baru' }).waitFor();
  return { store, owner };
}
