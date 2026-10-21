import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NAVIGATION, filterNavigation, getActiveNavigationIds } from '../src/components/layout/sidebar-navigation.ts';

test('no permissions removes restricted modules and retains public account menus', () => {
  const result = filterNavigation(NAVIGATION, () => false);
  assert.deepEqual(result.map(item => item.id), ['administration']);
  assert.deepEqual(result[0].children.map(item => item.id), ['subscription', 'account-settings']);
});

test('order read access keeps transactions and customers while excluding POS', () => {
  const result = filterNavigation(NAVIGATION, code => code === 'orders:read');
  const order = result.find(item => item.id === 'order');
  assert.deepEqual(order.children.map(item => item.id), ['transactions', 'customers']);
});

test('POS permission independently retains Order', () => {
  const result = filterNavigation(NAVIGATION, code => code === 'menu:pos');
  assert.deepEqual(result.find(item => item.id === 'order').children.map(item => item.id), ['pos']);
});

test('prunes empty nested parents and respects both parent and child permissions', () => {
  const tree = [{ id: 'module', title: 'Module', children: [{
    id: 'group', title: 'Group', permission: 'group:read', children: [
      { id: 'leaf', title: 'Leaf', url: '/leaf', permission: 'leaf:read' },
    ],
  }] }];
  assert.deepEqual(filterNavigation(tree, code => code === 'group:read'), []);
  assert.deepEqual(filterNavigation(tree, code => code === 'leaf:read'), []);
  assert.deepEqual(filterNavigation(tree, () => true), tree);
  assert.equal(tree[0].children[0].children.length, 1);
});

test('matches all ancestors of an active nested route, including trailing slashes', () => {
  assert.deepEqual([...getActiveNavigationIds(NAVIGATION, '/production/hpp/recipe-simulation/')],
    ['production', 'hpp', 'recipe-simulation']);
});

test('detail routes, aliases, and URL boundaries choose the correct inventory menu', () => {
  for (const path of ['/inventory/stocks/stock-1', '/inventory/purchase/new', '/inventory/movements/new']) {
    assert.deepEqual([...getActiveNavigationIds(NAVIGATION, path)], ['inventory', 'stocks']);
  }
  assert.deepEqual([...getActiveNavigationIds(NAVIGATION, '/inventory/purchase-orders/po-1/edit')], ['inventory', 'purchase']);
  assert.deepEqual([...getActiveNavigationIds(NAVIGATION, '/inventory/stocks-other')], []);
  assert.deepEqual([...getActiveNavigationIds(NAVIGATION, '/production/recipes/product-1')], ['production', 'products']);
});

test('more specific settings routes never activate Account Settings', () => {
  assert.deepEqual([...getActiveNavigationIds(NAVIGATION, '/settings/store')], ['administration', 'store-settings']);
  assert.deepEqual([...getActiveNavigationIds(NAVIGATION, '/settings?tab=profile'.split('?')[0])], ['administration', 'account-settings']);
});
