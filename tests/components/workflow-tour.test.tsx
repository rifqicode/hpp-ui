import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductionWorkflow } from '@/pages/landing/components/production-workflow'

const TRACK_TOP = 1_000
const panel = () => document.getElementById('workflow-example')
const track = () => document.querySelector<HTMLDivElement>('.tour-scroll-track')!

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('scrollY', 0)
  const originalRect = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this.classList.contains('tour-scroll-track')) {
      return new DOMRect(0, TRACK_TOP - window.scrollY, 1_200, Number.parseFloat((this as HTMLElement).style.height))
    }
    return originalRect.call(this)
  })
  vi.stubGlobal('scrollTo', vi.fn((options: ScrollToOptions) => {
    vi.stubGlobal('scrollY', options.top ?? 0)
    window.dispatchEvent(new Event('scroll'))
  }))
})
afterEach(() => vi.useRealTimers())

function renderTour() {
  const view = render(<ProductionWorkflow />)
  Object.defineProperty(track(), 'offsetHeight', { get: () => track().style.height === 'auto' ? 480 : Number.parseFloat(track().style.height) })
  return view
}

function scrollToProgress(progress: number) {
  const top = Number.parseFloat(track().style.getPropertyValue('--tour-sticky-top'))
  const frameHeight = Number.parseFloat(track().style.getPropertyValue('--tour-sticky-height'))
  vi.stubGlobal('scrollY', TRACK_TOP - top + (track().offsetHeight - frameHeight) * progress)
  fireEvent.scroll(window)
  act(() => { vi.advanceTimersByTime(20) })
}

describe('scroll-driven workflow tour', () => {
  it('starts with an overview and never advances just because time passes', () => {
    renderTour()
    expect(panel()).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(panel()).not.toBeInTheDocument()
    scrollToProgress(0.15)
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
    expect(screen.queryByRole('button', { name: /Putar|Jeda|Lanjutkan alur/ })).not.toBeInTheDocument()
  })

  it('follows the complete order forward, then reverses and returns to the overview', () => {
    renderTour()
    for (const [progress, text] of [[0.15, 'Rp 50.000'], [0.35, 'Dapur mulai menyiapkan pesanan.'], [0.55, 'Rp 24.000'], [0.75, 'Makanan siap untuk pelanggan.'], [0.95, 'Rp 26.000']] as const) {
      scrollToProgress(progress)
      expect(panel()!).toHaveTextContent(text)
    }
    scrollToProgress(0.35)
    expect(panel()!).toHaveTextContent('Dapur mulai menyiapkan pesanan.')
    scrollToProgress(0.15)
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
    scrollToProgress(0.01)
    expect(panel()).not.toBeInTheDocument()
  })

  it('lets a hotspot move the document to its stage using normal scrolling', () => {
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: 'Lihat tahap 5: Laporan' }))
    act(() => { vi.advanceTimersByTime(20) })
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    expect(panel()!).toHaveTextContent('Rp 26.000')
    fireEvent.click(screen.getByRole('button', { name: 'Lihat tahap 1: Kasir' }))
    act(() => { vi.advanceTimersByTime(20) })
    expect(panel()!).toHaveTextContent('Rp 50.000')
  })

  it('honors reduced motion when jumping directly to another stage', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: 'Lihat tahap 3: Bahan & biaya' }))
    act(() => { vi.advanceTimersByTime(20) })
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }))
    expect(panel()!).toHaveTextContent('Rp 24.000')
  })

  it('keeps a dismissed panel closed until the visitor reaches another stage', () => {
    renderTour()
    scrollToProgress(0.55)
    fireEvent.click(within(panel()!).getByRole('button', { name: 'Tutup penjelasan' }))
    scrollToProgress(0.6)
    expect(panel()).not.toBeInTheDocument()
    scrollToProgress(0.75)
    expect(panel()!).toHaveTextContent('Makanan siap untuk pelanggan.')
    fireEvent.keyDown(within(panel()!).getByRole('button', { name: 'Tutup penjelasan' }), { key: 'Escape' })
    expect(panel()).not.toBeInTheDocument()
    scrollToProgress(0.35)
    expect(panel()!).toHaveTextContent('Dapur mulai menyiapkan pesanan.')
  })

  it('does not replay on upward scrolling after the full tour has been passed', () => {
    renderTour()
    scrollToProgress(0.95)
    expect(panel()!).toHaveTextContent('Rp 26.000')
    scrollToProgress(1.05)
    expect(track()).toHaveClass('tour-scroll-complete')
    expect(track().style.height).toBe('auto')
    expect(panel()).not.toBeInTheDocument()
    vi.stubGlobal('scrollY', 300)
    fireEvent.scroll(window)
    act(() => { vi.advanceTimersByTime(20) })
    expect(panel()).not.toBeInTheDocument()
    expect(track()).toHaveClass('tour-scroll-complete')
    const previousCalls = vi.mocked(window.scrollTo).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Lihat tahap 5: Laporan' }))
    expect(panel()!).toHaveTextContent('Rp 26.000')
    expect(vi.mocked(window.scrollTo).mock.calls.length).toBe(previousCalls)
  })

  it('does not consume a tour skipped by jumping straight to a later page section', () => {
    renderTour()
    scrollToProgress(1.2)
    expect(track()).not.toHaveClass('tour-scroll-complete')
    expect(panel()).not.toBeInTheDocument()
    scrollToProgress(0.15)
    expect(panel()!).toHaveTextContent('Pesanan masuk lewat kasir.')
  })

  it('recalculates layout after a resize without falsely completing the tour', () => {
    renderTour()
    scrollToProgress(-0.5)
    expect(panel()).not.toBeInTheDocument()
    scrollToProgress(0.95)
    expect(panel()!).toHaveTextContent('Rp 26.000')
    vi.stubGlobal('innerHeight', 568)
    fireEvent.resize(window)
    act(() => { vi.advanceTimersByTime(20) })
    expect(track().style.getPropertyValue('--tour-sticky-height')).toBe('544px')
    expect(track()).not.toHaveClass('tour-scroll-complete')
    scrollToProgress(0.55)
    expect(panel()!).toHaveTextContent('Rp 24.000')
  })
})
