import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/store/use-auth-store'
import { useLoadingStore } from '@/store/use-loading-store'
import { usePermission } from '@/hooks/use-permission'
import { useInitialLoading } from '@/hooks/use-initial-loading'
import { store, user } from '../support/fixtures'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, token: null, permissions: [], activeStoreId: null, activeStoreName: null })
  useLoadingStore.setState({ pending: 0 })
})

describe('auth state', () => {
  it('persists the session token without persisting permission grants', () => {
    useAuthStore.getState().setAuth(user, 'test-token')
    useAuthStore.getState().setPermissions(['products:read'])
    expect(localStorage.getItem('token')).toBe('test-token')
    expect(JSON.parse(localStorage.getItem('auth-storage')!).state.permissions).toBeUndefined()
    expect(useAuthStore.getState().user).toEqual(user)
  })
  it('clears permissions when switching stores, preserves them when selecting the same store', () => {
    useAuthStore.getState().setActiveStoreId(store.id)
    useAuthStore.getState().setPermissions(['products:read'])
    useAuthStore.getState().setActiveStoreId(store.id)
    expect(useAuthStore.getState().permissions).toEqual(['products:read'])
    useAuthStore.getState().setActiveStoreId('store-2')
    useAuthStore.getState().setActiveStoreName('Toko Kedua')
    expect(useAuthStore.getState()).toMatchObject({ activeStoreId: 'store-2', activeStoreName: 'Toko Kedua', permissions: [] })
  })
  it('clears all session and permission state on logout', () => {
    useAuthStore.getState().setAuth(user, 'test-token')
    useAuthStore.getState().setActiveStoreId(store.id)
    sessionStorage.setItem('perm-cache', 'old-cache')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState()).toMatchObject({ user: null, token: null, activeStoreId: null, activeStoreName: null, permissions: [] })
    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('perm-cache')).toBeNull()
  })
  it('reactively checks single, any, and all permissions', () => {
    const { result } = renderHook(usePermission)
    expect(result.current.can('products:read')).toBe(false)
    act(() => useAuthStore.getState().setPermissions(['products:read', 'products:write']))
    expect(result.current.can('products:read')).toBe(true)
    expect(result.current.canAny('products:delete', 'products:write')).toBe(true)
    expect(result.current.canAny('products:delete')).toBe(false)
    expect(result.current.canAll('products:read', 'products:write')).toBe(true)
    expect(result.current.canAll('products:read', 'products:delete')).toBe(false)
    expect(result.current.canAny()).toBe(false)
    expect(result.current.canAll()).toBe(true)
  })
})

describe('loading state', () => {
  it('keeps the overlay active until all parallel requests finish and never goes negative', () => {
    const state = useLoadingStore.getState()
    state.start(); state.start(); state.stop()
    expect(useLoadingStore.getState().pending).toBe(1)
    state.stop(); state.stop()
    expect(useLoadingStore.getState().pending).toBe(0)
  })
  it('shows a placeholder only during the first load', () => {
    const { result, rerender } = renderHook(({ loading }) => useInitialLoading(loading), { initialProps: { loading: true } })
    expect(result.current).toBe(true)
    rerender({ loading: false })
    expect(result.current).toBe(false)
    rerender({ loading: true })
    expect(result.current).toBe(false)
  })
  it('does not show an initial placeholder when data is already available', () => {
    const { result, rerender } = renderHook(({ loading }) => useInitialLoading(loading), { initialProps: { loading: false } })
    rerender({ loading: true })
    expect(result.current).toBe(false)
  })
})
