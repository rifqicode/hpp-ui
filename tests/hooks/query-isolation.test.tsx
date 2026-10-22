import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProductsQuery } from '@/features/recipes/hooks/use-recipes-query'
import { useBatchesQuery, useBatchDetailQuery, useProductionCalendarQuery } from '@/features/production/hooks/use-production-query'
import { useSubscriptionUsage } from '@/features/subscription/hooks/useSubscriptionUsage'
import { useStoresQuery, useStorePermissionsQuery } from '@/features/settings/hooks/use-stores-query'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { productionService } from '@/features/production/services/production-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { useAuthStore } from '@/store/use-auth-store'
import { createWrapper } from '../support/render'
import { mockPageServices, resetSession } from '../support/page-services'
import { product, store } from '../support/fixtures'

beforeEach(() => { resetSession(); mockPageServices() })

describe('query enablement and store isolation', () => {
  it('does not fetch store-scoped data without an active store', () => {
    useAuthStore.setState({ activeStoreId: null })
    renderHook(() => ({ products: useProductsQuery(), batches: useBatchesQuery(), usage: useSubscriptionUsage(), calendar: useProductionCalendarQuery({}) }), createWrapper())
    expect(recipeService.getProducts).not.toHaveBeenCalled()
    expect(productionService.getBatches).not.toHaveBeenCalled()
    expect(subscriptionService.getUsage).not.toHaveBeenCalled()
    expect(productionService.getCalendar).not.toHaveBeenCalled()
  })
  it('honors explicit disabled queries and missing detail ids', () => {
    renderHook(() => ({ products: useProductsQuery(undefined, { enabled: false }), batches: useBatchesQuery({ enabled: false }), detail: useBatchDetailQuery(), permissions: useStorePermissionsQuery() }), createWrapper())
    expect(recipeService.getProducts).not.toHaveBeenCalled()
    expect(productionService.getBatches).not.toHaveBeenCalled()
    expect(productionService.getBatchById).not.toHaveBeenCalled()
    expect(settingsService.getStorePermissions).not.toHaveBeenCalled()
  })
  it('keeps product lists separate across stores and passes the scoped store header', async () => {
    vi.mocked(recipeService.getProducts).mockResolvedValueOnce([product()]).mockResolvedValueOnce([product({ id: 'p2', name: 'Produk Toko Kedua' })])
    const { result } = renderHook(() => useProductsQuery(), createWrapper())
    await waitFor(() => expect(result.current.data?.[0].name).toBe('Roti Coklat'))
    act(() => useAuthStore.getState().setActiveStoreId('store-2'))
    await waitFor(() => expect(result.current.data?.[0].name).toBe('Produk Toko Kedua'))
    expect(recipeService.getProducts).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ storeId: 'store-2', signal: expect.any(AbortSignal) }))
  })
  it('passes calendar filters, active store, and cancellation signal to the service', async () => {
    const filters = { month: '2026-01', statuses: 'COMPLETED', search: 'Roti' }
    const { result } = renderHook(() => useProductionCalendarQuery(filters), createWrapper())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(productionService.getCalendar).toHaveBeenCalledWith(filters, store.id, expect.any(AbortSignal))
  })
  it('selects the first available store when the session has no store selection', async () => {
    useAuthStore.setState({ activeStoreId: null, activeStoreName: null })
    const { result } = renderHook(useStoresQuery, createWrapper())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await waitFor(() => expect(useAuthStore.getState().activeStoreId).toBe(store.id))
    expect(useAuthStore.getState().activeStoreName).toBe(store.name)
  })
})
