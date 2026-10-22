import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as S from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTableData } from '@/hooks/use-table-data'

beforeEach(() => { document.cookie = 'sidebar_state=; max-age=0; path=/' })
function Contents() {
  return <><S.SidebarHeader><S.SidebarInput aria-label="Cari menu" /></S.SidebarHeader><S.SidebarContent><S.SidebarGroup><S.SidebarGroupLabel>Inventaris</S.SidebarGroupLabel><S.SidebarGroupAction aria-label="Tambah grup">+</S.SidebarGroupAction><S.SidebarGroupContent><S.SidebarMenu><S.SidebarMenuItem><S.SidebarMenuButton isActive>Stok</S.SidebarMenuButton><S.SidebarMenuAction aria-label="Opsi stok">...</S.SidebarMenuAction><S.SidebarMenuBadge>4</S.SidebarMenuBadge><S.SidebarMenuSub><S.SidebarMenuSubItem><S.SidebarMenuSubButton href="/stocks/new" isActive size="sm">Tambah stok</S.SidebarMenuSubButton></S.SidebarMenuSubItem></S.SidebarMenuSub></S.SidebarMenuItem><S.SidebarMenuSkeleton showIcon /><S.SidebarMenuSkeleton /></S.SidebarMenu></S.SidebarGroupContent></S.SidebarGroup></S.SidebarContent><S.SidebarSeparator /><S.SidebarFooter>Rina</S.SidebarFooter><S.SidebarRail /></>
}
describe('sidebar navigation component', () => {
  it('renders the complete menu and persists desktop toggles from buttons and keyboard', async () => {
    const user = userEvent.setup(), clicked = vi.fn()
    const { container } = render(<S.SidebarProvider><S.Sidebar collapsible="icon"><Contents /></S.Sidebar><S.SidebarInset><S.SidebarTrigger onClick={clicked} /></S.SidebarInset></S.SidebarProvider>)
    expect(screen.getByRole('link', { name: 'Tambah stok' })).toHaveAttribute('href', '/stocks/new')
    expect(screen.getByRole('button', { name: 'Stok' })).toHaveAttribute('data-active', 'true')
    await user.type(screen.getByRole('textbox', { name: 'Cari menu' }), 'Tepung')
    expect(screen.getByRole('textbox')).toHaveValue('Tepung')
    await user.click(screen.getByRole('button', { name: 'Tutup Sidebar' }))
    expect(clicked).toHaveBeenCalledOnce(); expect(document.cookie).toContain('sidebar_state=false')
    expect(container.querySelector('[data-collapsible=icon]')).toHaveAttribute('data-state', 'collapsed')
    fireEvent.keyDown(window, { key: 'x', ctrlKey: true })
    expect(screen.getByRole('button', { name: 'Buka Sidebar' })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('button', { name: 'Tutup Sidebar' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
    expect(document.cookie).toContain('sidebar_state=false')
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(document.cookie).toContain('sidebar_state=true')
  })
  it.each(['true', 'false'])('restores persisted expanded=%s', (value) => {
    document.cookie = `sidebar_state=${value}; path=/`
    render(<S.SidebarProvider><S.SidebarTrigger /></S.SidebarProvider>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', value)
  })
  it('notifies a controlled parent and supports fixed and floating sidebar variants', async () => {
    const onOpenChange = vi.fn(), user = userEvent.setup()
    const { rerender, container } = render(<S.SidebarProvider open={false} onOpenChange={onOpenChange}><S.Sidebar side="right" variant="floating"><S.SidebarMenuButton asChild><a href="/">Beranda</a></S.SidebarMenuButton></S.Sidebar><S.SidebarTrigger title="Menu toko" aria-label="Ubah navigasi" /></S.SidebarProvider>)
    await user.click(screen.getByRole('button', { name: 'Ubah navigasi' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(container.querySelector('[data-slot=sidebar]')).toHaveAttribute('data-side', 'right')
    rerender(<S.SidebarProvider><S.Sidebar collapsible="none"><S.SidebarGroupLabel asChild><h2>Menu tetap</h2></S.SidebarGroupLabel><S.SidebarGroupAction asChild><button>Tambah</button></S.SidebarGroupAction><S.SidebarMenuAction asChild showOnHover><a href="/edit">Ubah</a></S.SidebarMenuAction><S.SidebarMenuSubButton asChild><a href="/sub">Submenu</a></S.SidebarMenuSubButton></S.Sidebar></S.SidebarProvider>)
    expect(screen.getByRole('heading', { name: 'Menu tetap' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Submenu' })).toHaveAttribute('data-sidebar', 'menu-sub-button')
  })
  it('opens and closes the mobile navigation sheet', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    const user = userEvent.setup()
    render(<S.SidebarProvider><S.Sidebar><Contents /></S.Sidebar><S.SidebarTrigger /></S.SidebarProvider>)
    await user.click(screen.getByRole('button', { name: 'Buka Sidebar' }))
    expect(screen.getByRole('dialog', { name: 'Navigasi' })).toBeVisible()
    await user.click(screen.getAllByRole('button', { name: 'Tutup Sidebar' })[0])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('requires a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(S.useSidebar)).toThrow('useSidebar must be used within a SidebarProvider.')
  })
})
describe('layout data hooks', () => {
  it('subscribes to breakpoint changes and removes the listener', () => {
    const add = vi.fn(), remove = vi.fn()
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false, addEventListener: add, removeEventListener: remove } as unknown as MediaQueryList)
    const { result, unmount } = renderHook(() => useIsMobile(1024))
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1023px)')
    act(() => add.mock.calls[0][1]({ matches: true }))
    expect(result.current).toBe(true)
    unmount(); expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0][1])
  })
  it('loads and refreshes table data', async () => {
    vi.useFakeTimers()
    const rows = [{ id: 'stock-1' }]
    const { result } = renderHook(() => useTableData('/stocks', rows))
    expect(result.current.loading).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(500) })
    expect(result.current).toMatchObject({ data: rows, loading: false })
    act(() => { void result.current.refetch() })
    expect(result.current.loading).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(500) })
    expect(result.current.loading).toBe(false)
  })
})
