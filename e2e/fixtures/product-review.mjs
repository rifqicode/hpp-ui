export default async function setupProductReview(page) {
  const storeId = 'product-review-store';
  const permissions = ['menu:recipes', 'menu:dashboard', 'menu:stocks', 'menu:production', 'products:read', 'products:write', 'products:delete', 'recipes:update'];
  const materials = [{ id: 'coffee', name: 'Biji Kopi', base_unit: 'g', current_stock: '1000', cost_per_unit: '200' }, { id: 'milk', name: 'Susu', base_unit: 'ml', current_stock: '5000', cost_per_unit: '20' }];
  const ingredient = { id: 'recipe-coffee', stock_id: 'coffee', stock_name: 'Biji Kopi', base_unit: 'g', quantity: '15', unit_cost: '200', subtotal_cost: '3000', available_stock: '1000' };
  const variant = { id: 'latte-regular', product_id: 'latte', variant_name: 'Regular', sku: 'LAT-REG', unit: 'cup', selling_price: '18000', target_margin: '0.6', min_stock: '5', current_stock: '10', latest_hpp: '6200', estimated_hpp: '6000', is_default: true, is_active: true, ingredients: [ingredient], batches: [] };
  const group = { id: 'extra', name: 'Extra Shot', min_selection: 0, max_selection: 1, is_active: true, product_count: 1, options: [{ id: 'extra-shot', name: 'Extra Espresso', price: '5000', stock_id: 'coffee', quantity: '18', unit: 'g', is_active: true }] };
  let products = [
    { id: 'latte', name: 'Caffe Latte', category: 'Coffee', category_id: 'coffee-category', mode: 'MAKE_TO_ORDER', variants: [variant, { ...variant, id: 'latte-large', variant_name: 'Large', sku: 'LAT-LRG', selling_price: '25000', is_default: false }], modifier_groups: [group] },
    { id: 'brownie', name: 'Brownies Coklat', category: 'Pastry', mode: 'MAKE_TO_STOCK', variants: [{ ...variant, id: 'brownie-regular', variant_name: 'Regular', product_id: 'brownie', unit: 'pcs', current_stock: '0', selling_price: '5000', ingredients: [ingredient] }], modifier_groups: [] },
    { id: 'new-recipe', name: 'Resep Baru', category: 'Pastry', mode: 'MAKE_TO_STOCK', variants: [{ ...variant, id: 'new-regular', variant_name: 'Regular', latest_hpp: '0', estimated_hpp: '0', ingredients: [] }], modifier_groups: [] },
  ];
  const categories = [{ id: 'coffee-category', name: 'Coffee' }, { id: 'pastry-category', name: 'Pastry' }];
  const groups = [group];
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/api')[1];
    const method = request.method();
    let data = [];
    if (path === '/permissions/me') data = { permissions, role: 'STORE_OWNER' };
    else if (path === '/stores') data = [{ id: storeId, name: 'Toko Uji Layout', status: 'online' }];
    else if (path === '/subscription/usage') {
      const quota = { current: products.length, limit: 100, remaining: 100 - products.length, is_unlimited: false };
      data = { tier: 'MAX_GROWTH', subscription_status: 'ACTIVE', is_grace_period: false, is_trial: false, quotas: { products: quota, stocks: quota, stores: quota, staff: quota, batches: quota }, features: {} };
    } else if (path === '/products/categories') {
      if (method === 'POST') { const created = { id: `category-${categories.length}`, ...request.postDataJSON() }; categories.push(created); data = created; }
      else data = categories;
    } else if (path === '/modifier-groups') {
      if (method === 'POST') { const created = { id: `group-${groups.length}`, product_count: 0, ...request.postDataJSON() }; groups.push(created); data = created; }
      else data = groups;
    } else if (path?.startsWith('/modifier-groups/')) data = groups.find(g => g.id === path.split('/')[2]);
    else if (path === '/stocks') data = { items: materials, total: materials.length, page: 1, limit: 100, total_pages: 1 };
    else if (path === '/products' && method === 'GET') data = { items: products, total: products.length, page: 1, limit: 100, total_pages: 1 };
    else if (path === '/products' && method === 'POST') {
      const input = request.postDataJSON();
      data = { ...input, id: 'created-product', modifier_groups: groups.filter(g => input.modifier_group_ids?.includes(g.id)), variants: input.variants.map((v, i) => ({ ...v, id: `created-${i}`, product_id: 'created-product', current_stock: '0', latest_hpp: '0', estimated_hpp: '3000', ingredients: v.ingredients.map((line, n) => ({ ...ingredient, ...line, id: `created-line-${i}-${n}` })), batches: [] })) };
      products.push(data);
    } else if (path?.startsWith('/products/')) {
      const id = path.split('/')[2];
      if (method === 'DELETE') products = products.filter(p => p.id !== id);
      else if (method === 'PUT') { const input = request.postDataJSON(); const index = products.findIndex(p => p.id === id); products[index] = { ...products[index], ...input }; data = products[index]; }
      else data = products.find(p => p.id === id);
    }
    const origin = new URL(page.url()).origin;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'Content-Type,Authorization,X-Store-ID', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' }, body: JSON.stringify({ success: true, data }) });
  });
  await page.addInitScript(({ storeId }) => {
    localStorage.setItem('token', 'product-review-test');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 'product-review-user', name: 'Penguji', email: 'test@example.invalid', role: 'STORE_OWNER', account_type: 'OWNER' }, token: 'product-review-test', activeStoreId: storeId, activeStoreName: 'Toko Uji Layout', permissions: [] }, version: 0 }));
  }, { storeId });
}
