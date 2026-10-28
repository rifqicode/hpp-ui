import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductionWorkflow } from '@/pages/landing/components/production-workflow'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const panel = () => document.getElementById('workflow-example')

const advanceStep = () => act(() => { vi.advanceTimersByTime(8_000) })

describe('guided workflow tour', () => {
  it('starts with an overview and waits for the visitor to play or select a station', () => {
    render(<ProductionWorkflow />)
    expect(screen.getByRole('button', { name: 'Putar alur' })).toBeVisible()
    expect(panel()).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(panel()).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Lihat tahap/ })).toHaveLength(5)
  })

  it('plays POS through the final gross profit, then stops and supports replay', () => {
    render(<ProductionWorkflow />)
    fireEvent.click(screen.getByRole('button', { name: 'Putar alur' }))
    expect(panel()!).toHaveTextContent('Rp 50.000')
    advanceStep()
    expect(panel()!).toHaveTextContent('Dapur mulai menyiapkan pesanan.')
    advanceStep()
    expect(panel()!).toHaveTextContent('Rp 24.000')
    advanceStep()
    expect(panel()!).toHaveTextContent('Makanan siap untuk pelanggan.')
    advanceStep()
    expect(panel()!).toHaveTextContent('Rp 26.000')
    advanceStep()
    expect(screen.getByRole('button', { name: 'Putar ulang' })).toBeVisible()
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(panel()!).toHaveTextContent('Rp 26.000')
    fireEvent.click(screen.getByRole('button', { name: 'Putar ulang' }))
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
  })

  it('pauses while reading and cancels automatic progression when selecting another station', () => {
    render(<ProductionWorkflow />)
    fireEvent.click(screen.getByRole('button', { name: 'Putar alur' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jeda alur' }))
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan alur' }))
    advanceStep()
    expect(panel()!).toHaveTextContent('Dapur mulai menyiapkan pesanan.')
    fireEvent.click(screen.getByRole('button', { name: 'Lihat tahap 5: Laporan' }))
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(panel()!).toHaveTextContent('Rp 26.000')
    expect(screen.getByRole('button', { name: 'Lanjutkan alur' })).toBeVisible()
  })

  it('supports previous/next and closes the panel with Escape or its close button', () => {
    render(<ProductionWorkflow />)
    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '3. Bahan & biaya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(panel()!).toHaveTextContent('Makanan siap untuk pelanggan.')
    fireEvent.click(screen.getByRole('button', { name: 'Sebelumnya' }))
    expect(panel()!).toHaveTextContent('Rp 24.000')
    fireEvent.keyDown(within(panel()!).getByRole('button', { name: 'Tutup penjelasan' }), { key: 'Escape' })
    expect(panel()).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Putar alur' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tutup penjelasan' }))
    advanceStep()
    expect(panel()).not.toBeInTheDocument()
  })

  it('pauses playback when the browser tab is hidden', () => {
    render(<ProductionWorkflow />)
    fireEvent.click(screen.getByRole('button', { name: 'Putar alur' }))
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    hidden.mockRestore()
    advanceStep()
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
    expect(screen.getByRole('button', { name: 'Lanjutkan alur' })).toBeVisible()
  })
})
