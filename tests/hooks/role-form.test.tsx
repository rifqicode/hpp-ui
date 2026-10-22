import type { FormEvent } from 'react'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoleForm } from '@/features/settings/hooks/use-create-role'
import { settingsService } from '@/features/settings/services/settings-service'
import { createWrapper } from '../support/render'
import { permissions } from '../support/fixtures'
import { mockPageServices, resetSession } from '../support/page-services'

const submit = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent

beforeEach(() => {
  resetSession()
  mockPageServices()
  vi.spyOn(settingsService, 'createRole').mockResolvedValue({ id: 'role-1', name: 'KASIR' })
  vi.spyOn(settingsService, 'updateRole').mockResolvedValue({ id: 'role-1', name: 'Kasir Baru' })
})

async function setup(edit = false) {
  const options = createWrapper(edit ? '/settings/role/role-1' : '/settings/role/new', edit ? '/settings/role/:id' : '*')
  const hook = renderHook(useRoleForm, options)
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

describe('role form', () => {
  it('loads permission groups and toggles individual permissions without duplicates', async () => {
    const { result } = await setup()
    expect(result.current.permissionsCatalog).toEqual(permissions)
    act(() => result.current.togglePermission('products:read'))
    expect(result.current.roleData.permissionCodes).toEqual(['products:read'])
    act(() => result.current.togglePermission('products:read'))
    expect(result.current.roleData.permissionCodes).toEqual([])
    act(() => result.current.toggleGroupPermissions('products', true))
    act(() => result.current.toggleGroupPermissions('products', true))
    expect(result.current.roleData.permissionCodes).toEqual(permissions.map(p => p.code))
    act(() => result.current.toggleGroupPermissions('products', false))
    expect(result.current.roleData.permissionCodes).toEqual([])
  })
  it('selects and clears the full permission catalog', async () => {
    const { result } = await setup()
    act(() => result.current.handleSelectAllPermissions())
    expect(result.current.roleData.permissionCodes).toEqual(permissions.map(p => p.code))
    act(() => result.current.handleClearAllPermissions())
    expect(result.current.roleData.permissionCodes).toEqual([])
  })
  it('requires a display name and at least one permission', async () => {
    const { result } = await setup()
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.formError).toBe('Nama tampilan peran wajib diisi.')
    act(() => result.current.setRoleData({ name: '', displayName: 'Kasir', permissionCodes: [] }))
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.formError).toContain('minimal satu hak akses')
    expect(settingsService.createRole).not.toHaveBeenCalled()
  })
  it('generates the internal role name and returns to role settings', async () => {
    const { result } = await setup()
    act(() => result.current.setRoleData({ name: '', displayName: 'Kasir Toko', permissionCodes: ['products:read'] }))
    await act(() => result.current.handleSubmit(submit()))
    expect(settingsService.createRole).toHaveBeenCalledWith({ name: 'KASIR_TOKO', displayName: 'Kasir Toko', permissionCodes: ['products:read'] }, 'store-1')
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/settings/store?tab=roles')
  })
  it('populates an existing role and sends the edit DTO', async () => {
    vi.mocked(settingsService.getRoleById).mockResolvedValue({ id: 'role-1', name: 'Kasir', permissions })
    const { result } = await setup(true)
    expect(result.current.isEditMode).toBe(true)
    expect(result.current.roleData).toMatchObject({ displayName: 'Kasir', permissionCodes: permissions.map(p => p.code) })
    act(() => result.current.setRoleData({ name: 'Kasir', displayName: ' Kasir Baru ', description: ' Toko utama ', permissionCodes: ['products:read'] }))
    await act(() => result.current.handleSubmit(submit()))
    expect(settingsService.updateRole).toHaveBeenCalledWith('role-1', { name: 'Kasir Baru', description: 'Toko utama', permission_codes: ['products:read'] }, 'store-1')
    expect(settingsService.createRole).not.toHaveBeenCalled()
  })
  it('reports a role deleted before it could be edited', async () => {
    const { result } = await setup(true)
    expect(result.current.formError).toContain('Peran tidak ditemukan')
  })
  it.each([new Error('Tidak diizinkan'), null])('reports catalog failures: %s', async (error) => {
    vi.mocked(settingsService.getPermissionsCatalog).mockRejectedValue(error)
    const { result } = await setup()
    expect(result.current.formError).toBe(error instanceof Error ? error.message : 'Gagal memuat data peran.')
  })
  it.each([new Error('Nama sudah dipakai'), null])('keeps the form open after a failed save: %s', async (error) => {
    vi.mocked(settingsService.createRole).mockRejectedValue(error)
    const { result } = await setup()
    act(() => result.current.setRoleData({ name: 'KASIR', displayName: 'Kasir', permissionCodes: ['products:read'] }))
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.formError).toBe(error instanceof Error ? error.message : 'Gagal menambahkan peran baru.')
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/settings/role/new')
  })
})
