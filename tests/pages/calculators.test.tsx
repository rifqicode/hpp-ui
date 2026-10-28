import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeSimulationPage from '@/pages/production/recipe-simulation-page'
import HppCalculatorPage from '@/pages/production/hpp-calculator-page'
import { mockPageServices, resetSession } from '../support/page-services'
import { mockPopulatedPages } from '../support/populated-pages'
import { renderPage } from '../support/render'
const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
beforeEach(() => { resetSession(); mockPageServices(); mockPopulatedPages() })
describe('recipe cost simulator', () => {
  it('calculates ingredient waste, overhead per unit, and all pricing strategies', async () => {
    const user = userEvent.setup()
    renderPage(<RecipeSimulationPage />)
    change(screen.getByPlaceholderText('Contoh: Roti Manis Coklat Keju'), 'Roti Uji')
    change(screen.getByPlaceholderText('Contoh: 10'), '10')
    change(screen.getByPlaceholderText('Contoh: pcs'), 'pcs')
    const name = screen.getByPlaceholderText('Contoh: Tepung Terigu')
    change(name, 'Terigu')
    const row = name.closest('tr')!, inputs = within(row).getAllByRole('spinbutton')
    for (const [i, value] of ['10000', '1000', '100', '10'].entries()) change(inputs[i], value)
    change(within(row).getByPlaceholderText('g'), 'gram')
    const overheadRow = screen.getAllByPlaceholderText('Nama biaya overhead (misal: Kemasan / Listrik)...')[0].parentElement!.parentElement!
    change(within(overheadRow).getByRole('textbox'), 'Kemasan baru')
    change(within(overheadRow).getByRole('spinbutton'), '1000')
    expect(screen.getByText('HPP Total per Unit').parentElement).toHaveTextContent('Rp 210')
    expect(screen.getByText('Rekomendasi Harga Jual:').parentElement).toHaveTextContent('Rp 420')
    change(screen.getByRole('slider'), '30')
    expect(screen.getByText('Rekomendasi Harga Jual:').parentElement).toHaveTextContent('Rp 300')
    await user.click(screen.getByRole('button', { name: 'Markup' }))
    change(screen.getAllByRole('spinbutton').at(-1)!, '200')
    expect(screen.getByText('Rekomendasi Harga Jual:').parentElement).toHaveTextContent('Rp 630')
    await user.click(screen.getByRole('button', { name: 'Manual' }))
    change(screen.getAllByRole('spinbutton').at(-1)!, '1000')
    expect(screen.getByText('Rekomendasi Harga Jual:').parentElement).toHaveTextContent('Rp 1.000')
    await user.click(screen.getByRole('button', { name: 'Margin %' }))
    expect(screen.getByRole('slider')).toHaveValue('30')
    await user.click(screen.getByRole('button', { name: 'Tambah Bahan' }))
    expect(screen.getAllByPlaceholderText('Contoh: Tepung Terigu')).toHaveLength(2)
    await user.click(within(screen.getAllByPlaceholderText('Contoh: Tepung Terigu')[1].closest('tr')!).getByRole('button'))
    expect(screen.getAllByPlaceholderText('Contoh: Tepung Terigu')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Tambah Overhead' }))
    expect(screen.getAllByPlaceholderText('Nama biaya overhead (misal: Kemasan / Listrik)...')).toHaveLength(4)
    while (screen.queryAllByPlaceholderText('Nama biaya overhead (misal: Kemasan / Listrik)...').length) {
      const input = screen.getAllByPlaceholderText('Nama biaya overhead (misal: Kemasan / Listrik)...')[0]
      await user.click(within(input.parentElement!.parentElement!).getByRole('button'))
    }
    expect(screen.getByText(/Belum ada komponen overhead/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset Formulasi' }))
    expect(name).toHaveValue(''); expect(screen.getByText('HPP Total per Unit').parentElement).toHaveTextContent('Rp 0')
  })
  it('copies a financial summary and clears the success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    vi.useFakeTimers(); renderPage(<RecipeSimulationPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Salin Ringkasan' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Produk: Produk Tanpa Nama'))
    expect(screen.getByRole('button', { name: 'Tersalin!' })).toBeVisible()
    await act(async () => { await vi.advanceTimersByTimeAsync(2500) })
    expect(screen.getByRole('button', { name: 'Salin Ringkasan' })).toBeVisible()
  })
})
describe('legacy HPP calculator', () => {
  it('applies templates, edits every cost and price input, and resets the formulation', async () => {
    const user = userEvent.setup(); renderPage(<HppCalculatorPage />)
    await user.click(screen.getByRole('button', { name: /Donat Kentang Klasik/ }))
    expect(screen.getByPlaceholderText('Contoh: Roti Manis Coklat Keju')).toHaveValue('Donat Kentang Klasik')
    await user.click(screen.getByRole('button', { name: /Kopi Susu Gula Aren/ }))
    change(screen.getByPlaceholderText('Contoh: Roti Manis Coklat Keju'), 'Kopi Baru')
    change(screen.getByPlaceholderText('pcs / cup'), 'botol')
    await user.click(screen.getByRole('button', { name: /Tambah Bahan/ }))
    const name = screen.getAllByPlaceholderText('Nama bahan baku...').at(-1)!
    change(name, 'Air'); const row = name.closest('tr')!
    for (const input of within(row).getAllByRole('spinbutton')) change(input, '10')
    const textInputs = within(row).getAllByRole('textbox'); change(textInputs[1], 'ml')
    for (const input of screen.getAllByRole('spinbutton')) change(input, '20')
    change(screen.getByRole('slider'), '70')
    await user.click(screen.getByRole('button', { name: 'Markup' }))
    change(screen.getAllByRole('spinbutton').at(-2)!, '150')
    await user.click(screen.getByRole('button', { name: 'Manual' }))
    change(screen.getAllByRole('spinbutton').at(-2)!, '5000')
    expect(screen.getByText('Rekomendasi Harga Jual:').parentElement).toHaveTextContent('Rp 5.000')
    await user.click(screen.getByRole('button', { name: 'Margin %' }))
    await user.click(within(row).getByRole('button'))
    expect(screen.queryByDisplayValue('Air')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Reset/ }))
    expect(screen.getByPlaceholderText('Contoh: Roti Manis Coklat Keju')).toHaveValue('Roti Manis Coklat')
  })
  it('simulates saved products under material and yield price changes', async () => {
    const user = userEvent.setup(); renderPage(<HppCalculatorPage />)
    await user.click(screen.getByRole('tab', { name: /Simulasi What-If Produk Tersimpan/ }))
    await screen.findByText('Roti Coklat - Regular')
    await user.click(screen.getByText('Donat - Regular'))
    const sliders = screen.getAllByRole('slider')
    for (const slider of sliders) change(slider, '20')
    await user.click(screen.getByText('Roti Coklat - Regular'))
    expect(screen.getByText('Roti Coklat - Regular')).toBeVisible()
  })
})
