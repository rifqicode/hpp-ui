import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIChatFloatingDrawer } from '@/features/ai-chat/components/ai-chat-drawer'
import { AIChatMessageItem } from '@/features/ai-chat/components/ai-chat-message-item'
import { useAIChat } from '@/features/ai-chat/hooks/use-ai-chat'
vi.mock('@/features/ai-chat/hooks/use-ai-chat', () => ({ useAIChat: vi.fn() }))
const mockCanAccessFeature = vi.fn().mockReturnValue(true)
vi.mock('@/features/subscription/hooks/useSubscriptionGuards', () => ({
  useSubscriptionGuards: () => ({
    canAccessFeature: mockCanAccessFeature,
  }),
}))
function state(overrides: Partial<ReturnType<typeof useAIChat>> = {}) {
  return { isOpen: true, setIsOpen: vi.fn(), conversations: [], activeConversation: null, isLoadingHistory: false, isLoadingActive: false, isSending: false, error: null, quotaExceeded: false, quotaMessage: '', selectConversation: vi.fn(), startNewChat: vi.fn(), sendMessage: vi.fn().mockResolvedValue(undefined), retryLastMessage: vi.fn(), deleteConversation: vi.fn(), loadHistory: vi.fn(), loadActiveConversation: vi.fn(), ...overrides }
}
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn()
  mockCanAccessFeature.mockReturnValue(true)
})
const conversation = { id: 'c1', title: 'Analisis Stok', store_id: 'store-1', user_id: 'user-1', created_at: '2026-01-01', updated_at: '2026-01-01', messages: [{ id: 'm1', role: 'user' as const, content: 'Stok?', created_at: '2026-01-01' }, { id: 'm2', role: 'assistant' as const, content: 'Jawaban gagal', is_error: true, created_at: '2026-01-01' }] }
describe('AI drawer controls', () => {
  it('opens and closes using the floating button and drawer header', async () => {
    const user = userEvent.setup(), model = state({ isOpen: false })
    vi.mocked(useAIChat).mockReturnValue(model)
    const { rerender } = render(<AIChatFloatingDrawer />)
    await user.click(screen.getByRole('button', { name: 'Tanya Asisten AI' }))
    expect(model.setIsOpen).toHaveBeenCalledWith(true)
    model.isOpen = true; rerender(<AIChatFloatingDrawer />)
    await user.click(screen.getByTitle('Tutup asisten AI'))
    expect(model.setIsOpen).toHaveBeenCalledWith(false)
  })
  it('sends entered messages, preserves shift-enter, and submits quick questions', async () => {
    const user = userEvent.setup(), model = state()
    vi.mocked(useAIChat).mockReturnValue(model); render(<AIChatFloatingDrawer />)
    const input = screen.getByRole('textbox')
    expect(screen.getByTestId('ai-chat-send-btn')).toBeDisabled()
    fireEvent.submit(input.closest('form')!)
    expect(model.sendMessage).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'Stok bahan?' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(model.sendMessage).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(model.sendMessage).toHaveBeenCalledWith('Stok bahan?'); expect(input).toHaveValue('')
    await user.type(input, 'Ringkasan')
    await user.click(screen.getByTestId('ai-chat-send-btn'))
    expect(model.sendMessage).toHaveBeenCalledWith('Ringkasan')
    await user.click(screen.getByRole('button', { name: 'Bahan baku apa saja yang stoknya mau habis?' }))
    expect(model.sendMessage).toHaveBeenCalledWith('Bahan baku apa saja yang stoknya mau habis?')
  })
  it('navigates history, selects and deletes sessions, and starts a clean chat', async () => {
    const user = userEvent.setup(), model = state({ activeConversation: conversation, conversations: [{ id: 'c1', title: 'Analisis Stok', last_message: 'Stok?', message_count: 2, updated_at: '2026-01-01', created_at: '2026-01-01' }, { id: 'c2', title: '', message_count: 0, updated_at: '2026-01-02', created_at: '2026-01-02' }] })
    vi.mocked(useAIChat).mockReturnValue(model); render(<AIChatFloatingDrawer />)
    expect(screen.getByText('Stok?')).toBeVisible()
    await user.click(screen.getByTestId('ai-retry-btn')); expect(model.retryLastMessage).toHaveBeenCalledOnce()
    await user.click(screen.getByTestId('ai-new-chat-btn')); expect(model.startNewChat).toHaveBeenCalledOnce()
    await user.click(screen.getByTestId('ai-history-btn'))
    expect(screen.getByRole('heading', { name: 'Riwayat Sesi Percakapan' })).toBeVisible()
    await user.click(screen.getByTestId('ai-delete-btn-c2')); expect(model.deleteConversation).toHaveBeenCalledWith('c2'); expect(model.selectConversation).not.toHaveBeenCalled()
    await user.click(screen.getByText('Percakapan Tanpa Judul')); expect(model.selectConversation).toHaveBeenCalledWith('c2')
    await user.click(screen.getByTestId('ai-history-btn')); await user.click(screen.getByTestId('ai-back-btn'))
    expect(screen.getByRole('textbox')).toBeVisible()
    await user.click(screen.getByTestId('ai-history-btn')); await user.click(screen.getByTestId('ai-panel-new-chat-btn'))
    expect(model.startNewChat).toHaveBeenCalledTimes(2)
  })
  it.each(['loading-history', 'empty-history', 'loading-active', 'sending', 'quota', 'error'])('shows %s state', async (scenario) => {
    const model = state({ isLoadingHistory: scenario === 'loading-history', isLoadingActive: scenario === 'loading-active', isSending: scenario === 'sending', activeConversation: scenario === 'sending' ? conversation : null, quotaExceeded: scenario === 'quota', quotaMessage: 'Kuota 25 habis', error: scenario === 'error' ? 'Jaringan terputus' : null })
    vi.mocked(useAIChat).mockReturnValue(model); render(<AIChatFloatingDrawer />)
    if (scenario.includes('history')) {
      await userEvent.click(screen.getByTestId('ai-history-btn'))
      expect(screen.getByText(scenario === 'loading-history' ? 'Memuat daftar sesi...' : 'Belum ada riwayat percakapan tersimpan')).toBeVisible()
    } else if (scenario === 'loading-active') expect(screen.getByText('Memuat sesi percakapan...')).toBeVisible()
    else if (scenario === 'sending') { expect(screen.getByText('Memproses...')).toBeVisible(); expect(screen.getByRole('textbox')).toBeDisabled() }
    else if (scenario === 'quota') { expect(screen.getByText('Kuota 25 habis')).toBeVisible(); expect(screen.getByRole('textbox')).toBeDisabled() }
    else expect(screen.getByText('Jaringan terputus')).toBeVisible()
  })
  it('formats assistant emphasis, lists, and numbered text', () => {
    render(<AIChatMessageItem message={{ id: 'm1', role: 'assistant', content: '**Ringkasan**\n- **Tepung** tersedia\n* **Gula** cukup\n1. Beli bahan\nCatatan akhir', created_at: '2026-01-01' }} />)
    expect(screen.getByText('Ringkasan').tagName).toBe('STRONG'); expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('1. Beli bahan')).toBeVisible(); expect(screen.getByText('Catatan akhir')).toBeVisible()
  })

  it('dispatches open-upgrade-modal when floating button is clicked without ai_assistant feature access', async () => {
    mockCanAccessFeature.mockReturnValue(false)
    const user = userEvent.setup(), model = state({ isOpen: false })
    vi.mocked(useAIChat).mockReturnValue(model)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    render(<AIChatFloatingDrawer />)

    await user.click(screen.getByTestId('ai-chat-floating-btn'))
    expect(model.setIsOpen).not.toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'open-upgrade-modal',
        detail: expect.objectContaining({
          code: 'FEATURE_LOCKED',
          message: expect.stringContaining('Max Growth Enterprise'),
        }),
      })
    )
  })

  it('renders locked state banner in drawer when opened without feature access and handles upgrade button', async () => {
    mockCanAccessFeature.mockReturnValue(false)
    const user = userEvent.setup(), model = state({ isOpen: true })
    vi.mocked(useAIChat).mockReturnValue(model)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    render(<AIChatFloatingDrawer />)

    expect(screen.getByTestId('ai-locked-state')).toBeVisible()
    expect(screen.getByText('Asisten AI Bisnis Terkunci')).toBeVisible()
    expect(screen.queryByTestId('ai-chat-input')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('ai-upgrade-btn'))
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'open-upgrade-modal',
        detail: expect.objectContaining({
          code: 'FEATURE_LOCKED',
          tier: 'MAX_GROWTH',
        }),
      })
    )
  })
})
