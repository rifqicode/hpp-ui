import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AVAILABLE_MATERIALS, recipeService } from '@/features/recipes/services/recipe-service'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api-client', () => ({ default: http }))
const raw = { id: 'p1', name: 'Roti', selling_price: '10000', yield_qty: 10, target_margin: 50, ingredients: [{ id: 'i1', stock_id: 's1', stock_name: 'Tepung', quantity: 100, unit_cost: 10 }] }
const material = { id: 's1', name: 'Tepung', baseUnit: 'g', currentStock: 5000, avgCostPerUnit: 10 }

async function seed() {
  http.get.mockResolvedValueOnce({ data: [raw] })
  return (await recipeService.getProducts())[0]
}
beforeEach(async () => {
  vi.resetAllMocks()
  AVAILABLE_MATERIALS.splice(0, AVAILABLE_MATERIALS.length, material)
  http.get.mockResolvedValueOnce({ data: [] })
  await recipeService.getProducts()
  for (const method of Object.values(http)) method.mockRejectedValue(new Error('Offline'))
})

describe('recipe service list and cache', () => {
  it('loads every page and carries store scope and filters', async () => {
    http.get.mockResolvedValueOnce({ data: { items: [raw], total_pages: 2 } }).mockResolvedValueOnce({ data: { items: [{ ...raw, id: 'p2' }], total_pages: 2 } })
    const controller = new AbortController()
    expect(await recipeService.getProducts({ search: 'Roti', category: 'All' }, { storeId: 's1', signal: controller.signal })).toHaveLength(2)
    expect(http.get).toHaveBeenLastCalledWith('/products', { params: { search: 'Roti', category: undefined, page: 2, limit: 100 }, headers: { 'X-Store-ID': 's1' }, signal: controller.signal })
  })
  it.each([null, {}, { items: 'bad' }])('rejects malformed product lists: %j', async data => {
    http.get.mockResolvedValueOnce({ data })
    await expect(recipeService.getProducts()).rejects.toThrow('Invalid product list response')
  })
  it('rejects an empty intermediate page instead of silently dropping products', async () => {
    http.get.mockResolvedValueOnce({ data: { items: [], total_pages: 2 } })
    await expect(recipeService.getProducts()).rejects.toThrow('Incomplete product list response')
  })
  it('refreshes a cached detail and falls back to it during an outage', async () => {
    await seed()
    http.get.mockResolvedValueOnce({ data: { ...raw, name: 'Roti Baru' } })
    expect((await recipeService.getProductById('p1')).name).toBe('Roti Baru')
    expect((await recipeService.getProductById('p1')).name).toBe('Roti Baru')
    await expect(recipeService.getProductById('missing')).rejects.toThrow('tidak ditemukan')
    http.get.mockResolvedValueOnce({ data: { ...raw, id: 'p2' } })
    expect((await recipeService.getProductById('p2')).id).toBe('p2')
  })
  it('does not accept a detail response without an id', async () => {
    http.get.mockResolvedValueOnce({ data: {} })
    await expect(recipeService.getProductById('missing')).rejects.toThrow('tidak ditemukan')
  })
  it('returns the product summary', async () => {
    const summary = { total_products: 3, active_products: 2, low_stock_count: 1 }
    http.get.mockResolvedValueOnce({ data: summary })
    expect(await recipeService.getProductSummary()).toEqual(summary)
  })
})

describe('recipe persistence and local fallback', () => {
  it('maps a full create DTO to backend fields', async () => {
    http.post.mockResolvedValueOnce({ data: raw })
    await recipeService.createProduct({ name: 'Roti', category: 'Bakery', categoryId: 'cat', unit: 'box', mode: 'MAKE_TO_ORDER', yieldQty: 10, wastePct: 5, sellingPrice: 15000, targetMargin: 40, minStock: 2, description: 'Resep', imageUrl: 'image.png', initialIngredients: [{ stockId: 's1', quantity: 100 }] })
    expect(http.post).toHaveBeenCalledWith('/products', { name: 'Roti', category: 'Bakery', category_id: 'cat', unit: 'box', mode: 'MAKE_TO_ORDER', yield_qty: 10, waste_pct: 5, selling_price: 15000, target_margin: 40, min_stock: 2, description: 'Resep', image_url: 'image.png', initial_ingredients: [{ stock_id: 's1', quantity: 100 }] })
  })
  it('sends defaults for omitted create fields', async () => {
    http.post.mockResolvedValueOnce({ data: raw })
    await recipeService.createProduct({ name: 'Roti', category: '', unit: '' })
    expect(http.post).toHaveBeenCalledWith('/products', expect.objectContaining({ category: 'Roti', unit: 'pcs', yield_qty: 1, waste_pct: 0, selling_price: 0, initial_ingredients: [] }))
  })
  it('calculates fallback ingredients, waste, and a selling price rounded to 500 rupiah', async () => {
    const created = await recipeService.createProduct({ name: 'Roti', category: '', unit: '', yieldQty: 10, wastePct: 10, targetMargin: 50, initialIngredients: [{ stockId: 's1', quantity: 100 }, { stockId: 'missing', quantity: 10 }] })
    expect(created.ingredients).toHaveLength(1)
    expect(created.latestHpp).toBeCloseTo(110)
    expect(created.sellingPrice).toBe(500)
    expect((await recipeService.getProductById(created.id)).name).toBe('Roti')
  })
  it('keeps an explicit price and handles a recipe without ingredients', async () => {
    const created = await recipeService.createProduct({ name: 'Roti', category: 'Roti', unit: 'pcs', sellingPrice: 12000, yieldQty: 0 })
    expect(created).toMatchObject({ sellingPrice: 12000, yieldQty: 1, latestHpp: 0 })
  })
  it('updates the full DTO and refreshes the cached product', async () => {
    await seed()
    http.put.mockResolvedValueOnce({ data: { ...raw, name: 'Roti Baru' } })
    const update = { name: 'Roti Baru', category: 'Cake', categoryId: 'c1', unit: 'box', mode: 'MAKE_TO_ORDER' as const, yieldQty: 20, wastePct: 3, imageUrl: null, sellingPrice: 15000, targetMargin: 25, minStock: 2, description: 'Baru' }
    expect((await recipeService.updateProduct('p1', update)).name).toBe('Roti Baru')
    expect(http.put).toHaveBeenCalledWith('/products/p1', { name: 'Roti Baru', category: 'Cake', category_id: 'c1', unit: 'box', mode: 'MAKE_TO_ORDER', yield_qty: 20, waste_pct: 3, image_url: null, selling_price: 15000, target_margin: 25, min_stock: 2, description: 'Baru' })
  })
  it('preserves omitted fields in fallback updates and rejects unknown products', async () => {
    await seed()
    expect(await recipeService.updateProduct('p1', { name: 'Baru' })).toMatchObject({ name: 'Baru', sellingPrice: 10000, yieldQty: 10 })
    expect(await recipeService.updateProduct('p1', { sellingPrice: 0, minStock: 0, currentStock: 3, yieldQty: 2, wastePct: 1, mode: 'MAKE_TO_ORDER', imageUrl: 'x', categoryId: 'c1' })).toMatchObject({ sellingPrice: 0, minStock: 0, currentStock: 3, yieldQty: 2, wastePct: 1, mode: 'MAKE_TO_ORDER', imageUrl: 'x', categoryId: 'c1' })
    await expect(recipeService.updateProduct('missing', {})).rejects.toThrow('tidak ditemukan')
  })
  it('adds, merges, edits, and removes fallback ingredients', async () => {
    await seed()
    const added = await recipeService.addIngredient('p1', { stockId: 's1', quantity: 20 })
    expect(added.ingredients[0].quantity).toBe(120)
    AVAILABLE_MATERIALS.push({ ...material, id: 's2', name: 'Gula' })
    const second = await recipeService.addIngredient('p1', { stockId: 's2', quantity: 50 })
    expect(second.ingredients).toHaveLength(2)
    expect((await recipeService.updateIngredientQuantity('p1', 'i1', 25)).ingredients[0].subtotalCost).toBe(250)
    expect((await recipeService.removeIngredient('p1', 'i1')).ingredients.map(i => i.stockId)).toEqual(['s2'])
    await expect(recipeService.addIngredient('p1', { stockId: 'bad', quantity: 1 })).rejects.toThrow()
    await expect(recipeService.addIngredient('bad', { stockId: 's1', quantity: 1 })).rejects.toThrow()
    await expect(recipeService.updateIngredientQuantity('p1', 'bad', 1)).rejects.toThrow()
    await expect(recipeService.updateIngredientQuantity('bad', 'i1', 1)).rejects.toThrow()
    await expect(recipeService.removeIngredient('bad', 'i1')).rejects.toThrow()
  })
  it('uses server recipe mutation responses when available', async () => {
    await seed()
    http.post.mockResolvedValueOnce({ data: raw })
    expect((await recipeService.addIngredient('p1', { stockId: 's1', quantity: 20 })).id).toBe('p1')
    http.put.mockResolvedValueOnce({ data: raw })
    expect((await recipeService.updateIngredientQuantity('p1', 'i1', 5)).id).toBe('p1')
    http.delete.mockResolvedValueOnce({ data: raw })
    expect((await recipeService.removeIngredient('p1', 'i1')).id).toBe('p1')
    http.delete.mockResolvedValueOnce({ data: null })
    await recipeService.deleteProduct('p1')
    await expect(recipeService.getProductById('p1')).rejects.toThrow()
  })
})

describe('recipe estimates, materials, categories, and uploads', () => {
  it.each(['snake', 'camel', 'missing'])('maps %s estimate response fields', async naming => {
    const data = naming === 'snake' ? { product_id: 'p1', product_name: 'Roti', selling_price: '10000', target_margin: '50', yield_qty: '10', waste_pct: '5', raw_material_total: '1000', bom_cost_per_unit: '100', estimated_hpp: '105', recommended_price: '500', actual_margin: '90', actual_markup: '100', bom_items: [{ stock_id: 's1', stock_name: 'Tepung', quantity: '100', unit_cost: '10', subtotal_cost: '1000' }] } : naming === 'camel' ? { productId: 'p1', productName: 'Roti', sellingPrice: 10000, targetMargin: 50, yieldQty: 10, wastePct: 5, rawMaterialTotal: 1000, bomCostPerUnit: 100, estimatedHpp: 105, recommendedPrice: 500, actualMargin: 90, actualMarkup: 100, bomItems: [{ stockId: 's1', stockName: 'Tepung', quantity: 100, unitCost: 10, subtotalCost: 1000 }] } : {}
    http.get.mockResolvedValueOnce({ data })
    const estimate = await recipeService.getProductEstimate('p1')
    expect(estimate.productId).toBe('p1')
    expect(estimate.bomItems).toHaveLength(naming === 'missing' ? 0 : 1)
    expect(estimate.estimatedHpp).toBe(naming === 'missing' ? 0 : 105)
  })
  it('calculates estimates from cached recipes when the endpoint fails', async () => {
    await seed()
    expect(await recipeService.getProductEstimate('p1')).toMatchObject({ estimatedHpp: 100, recommendedPrice: 500, actualMargin: 99, actualMarkup: 9900 })
    expect(await recipeService.getProductEstimate('missing')).toMatchObject({ productName: 'Produk', estimatedHpp: 0, actualMargin: 0 })
    await recipeService.updateProduct('p1', { sellingPrice: 0, targetMargin: 100 })
    expect(await recipeService.getProductEstimate('p1')).toMatchObject({ recommendedPrice: 150, actualMargin: 0 })
  })
  it.each(['known', 'stock', 'weighted', 'empty-batches', 'zero-batch', 'detail-error'])('resolves material costs from %s', async source => {
    http.get.mockResolvedValueOnce({ data: { items: [{ id: 's1', name: 'Tepung', base_unit: 'g', current_stock: '50', cost_per_unit: source === 'known' ? 15 : 0 }] } })
    if (source === 'stock') http.get.mockResolvedValueOnce({ data: { stock: { cost_per_unit: 20 } } })
    if (source === 'weighted') http.get.mockResolvedValueOnce({ data: { active_batches: [{ remaining_quantity: 2, price_per_unit: 10 }, { remaining_quantity: 3, price_per_unit: 20 }, { remaining_quantity: -1 }] } })
    if (source === 'empty-batches') http.get.mockResolvedValueOnce({ data: {} })
    if (source === 'zero-batch') http.get.mockResolvedValueOnce({ data: { active_batches: [{ remaining_quantity: 0, price_per_unit: 12 }] } })
    const [result] = await recipeService.getAvailableMaterials()
    expect(result.avgCostPerUnit).toBe({ known: 15, stock: 20, weighted: 16, 'empty-batches': 0, 'zero-batch': 12, 'detail-error': 0 }[source])
  })
  it('falls back to the material cache and tolerates empty categories', async () => {
    expect(await recipeService.getAvailableMaterials()).toEqual([material])
    expect(await recipeService.getCategories()).toEqual([])
    http.get.mockResolvedValueOnce({ data: {} })
    expect(await recipeService.getCategories()).toEqual([])
    http.get.mockResolvedValueOnce({ data: [{ id: 'c1', name: 'Roti' }] })
    expect(await recipeService.getCategories()).toHaveLength(1)
    http.post.mockResolvedValueOnce({ data: { id: 'c1', name: 'Roti' } })
    expect((await recipeService.createCategory('Roti')).id).toBe('c1')
    http.delete.mockResolvedValueOnce({})
    await recipeService.deleteCategory('c1')
    expect(http.delete).toHaveBeenCalledWith('/products/categories/c1')
  })
  it.each(['snake', 'camel'])('maps %s presigned fields and uploads the image', async naming => {
    http.post.mockResolvedValueOnce({ data: naming === 'snake' ? { upload_url: 'https://example.com/upload', public_url: 'https://example.com/image', key: 'img' } : { uploadUrl: 'https://example.com/upload', publicUrl: 'https://example.com/image', key: 'img' } })
    const fetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetch)
    const file = new File(['image'], 'image.jpg')
    expect(await recipeService.uploadProductImage(file)).toBe('https://example.com/image')
    expect(fetch).toHaveBeenCalledWith('https://example.com/upload', expect.objectContaining({ method: 'PUT', body: file, headers: { 'Content-Type': 'image/jpeg' } }))
  })
  it('reports missing upload permission and failed storage writes', async () => {
    http.post.mockResolvedValueOnce({ data: {} })
    await expect(recipeService.uploadProductImage(new File(['x'], 'x.jpg'))).rejects.toThrow('izin upload')
    http.post.mockResolvedValueOnce({ data: { upload_url: 'https://example.com/upload' } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(recipeService.uploadProductImage(new File(['x'], 'x.jpg', { type: 'image/png' }))).rejects.toThrow('HTTP 500')
  })
})
