import { act, renderHook, waitFor } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAIChat } from '@/features/ai-chat/hooks/use-ai-chat'
import { aiChatService } from '@/features/ai-chat/services/ai-chat-service'
import type { AIChatResponse, ConversationDetail } from '@/features/ai-chat/types/ai-chat'
import { resetSession } from '../support/page-services'
import { deferred } from '../support/render'
const conversation: ConversationDetail = { id: 'chat1', store_id: 'store-1', user_id: 'user-1', title: 'Stok', created_at: '2026-01-01', updated_at: '2026-01-01', messages: [{ id: 'm1', role: 'user', content: 'Stok?', created_at: '2026-01-01' }] }
const answer: AIChatResponse = { conversation_id: 'chat1', message_id: 'm2', content: 'Stok masih tersedia', role: 'assistant', created_at: '2026-01-01' }
beforeEach(() => {
  resetSession()
  vi.spyOn(aiChatService, 'getConversations').mockResolvedValue({ items: [{ id: 'chat1', title: 'Stok', message_count: 1, created_at: '2026-01-01', updated_at: '2026-01-01' }], total: 1, page: 1, limit: 50 })
  vi.spyOn(aiChatService, 'getActiveConversation').mockResolvedValue(conversation)
  vi.spyOn(aiChatService, 'getConversation').mockResolvedValue(conversation)
  vi.spyOn(aiChatService, 'createConversation').mockResolvedValue(answer)
  vi.spyOn(aiChatService, 'sendMessage').mockResolvedValue(answer)
  vi.spyOn(aiChatService, 'retryMessage').mockResolvedValue(answer)
  vi.spyOn(aiChatService, 'deleteConversation').mockResolvedValue(undefined)
})

describe('AI conversations', () => {
  it.each(['active', 'saved', 'new'])('hydrates the %s chat preference when opened', async preference => {
    if (preference !== 'active') localStorage.setItem('ai_active_session_store-1', preference === 'new' ? 'new' : 'chat1')
    const { result } = renderHook(useAIChat)
    act(() => result.current.setIsOpen(true))
    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false))
    await waitFor(() => expect(result.current.isLoadingActive).toBe(false))
    expect(result.current.conversations).toHaveLength(1)
    expect(result.current.activeConversation?.id ?? null).toBe(preference === 'new' ? null : 'chat1')
  })
  it('treats a missing active conversation as a new session', async () => {
    const config = { headers: new AxiosHeaders() }
    vi.mocked(aiChatService.getActiveConversation).mockRejectedValue(new AxiosError('Missing', '', config, undefined, { status: 404, data: {}, headers: {}, config, statusText: 'Not found' }))
    const { result } = renderHook(useAIChat)
    await act(() => result.current.loadActiveConversation())
    expect(result.current.activeConversation).toBeNull()
    expect(localStorage.getItem('ai_active_session_store-1')).toBe('new')
  })
  it('ignores blank messages, creates a thread and then appends to the existing one', async () => {
    const { result } = renderHook(useAIChat)
    await act(() => result.current.sendMessage('  '))
    expect(aiChatService.createConversation).not.toHaveBeenCalled()
    await act(() => result.current.sendMessage(' Stok? '))
    expect(aiChatService.createConversation).toHaveBeenCalledWith({ message: 'Stok?' })
    expect(result.current.activeConversation?.messages.map(m => m.role)).toEqual(['user', 'assistant'])
    await act(() => result.current.sendMessage('Harga?'))
    expect(aiChatService.sendMessage).toHaveBeenCalledWith('chat1', { message: 'Harga?' })
    expect(result.current.isSending).toBe(false)
  })
  it('keeps an optimistic message visible and prevents duplicate sending', async () => {
    const pending = deferred<AIChatResponse>()
    vi.mocked(aiChatService.createConversation).mockReturnValue(pending.promise)
    const { result } = renderHook(useAIChat)
    let operation!: Promise<void>
    act(() => { operation = result.current.sendMessage('Stok?') })
    expect(result.current.isSending).toBe(true)
    expect(result.current.activeConversation?.messages[0].content).toBe('Stok?')
    await act(() => result.current.sendMessage('Double'))
    expect(aiChatService.createConversation).toHaveBeenCalledTimes(1)
    await act(async () => { pending.resolve(answer); await operation })
    expect(result.current.activeConversation?.id).toBe('chat1')
  })
  it.each([new Error('Offline'), {}, { response: { data: { message: 'Server sibuk' } } }])('shows a retryable message after %j', async error => {
    vi.mocked(aiChatService.createConversation).mockRejectedValueOnce(error)
    const { result } = renderHook(useAIChat)
    await act(() => result.current.sendMessage('Stok?'))
    expect(result.current.error).toBeTruthy()
    expect(result.current.activeConversation?.messages.at(-1)?.is_error).toBe(true)
    await act(() => result.current.retryLastMessage())
    expect(result.current.error).toBeNull()
    expect(result.current.activeConversation?.messages.some(m => m.is_error)).toBe(false)
    expect(result.current.activeConversation?.id).toBe('chat1')
  })
  it.each([true, false])('detects quota response with explicit limit=%s', async explicit => {
    vi.mocked(aiChatService.createConversation).mockRejectedValue({ response: { status: 403, data: explicit ? { errors: { code: 'QUOTA_EXCEEDED', limit: 25 } } : { message: 'QUOTA_EXCEEDED' } } })
    const { result } = renderHook(useAIChat)
    await act(() => result.current.sendMessage('Stok?'))
    expect(result.current.quotaExceeded).toBe(true)
    expect(result.current.quotaMessage).toContain(explicit ? '25 pertanyaan' : '10 pertanyaan')
    act(() => result.current.startNewChat())
    expect(result.current).toMatchObject({ activeConversation: null, quotaExceeded: false, error: null })
  })
  it('retries a server conversation and deletes its active session', async () => {
    const { result } = renderHook(useAIChat)
    await act(() => result.current.retryLastMessage())
    expect(aiChatService.retryMessage).not.toHaveBeenCalled()
    await act(() => result.current.selectConversation('chat1'))
    await act(() => result.current.retryLastMessage())
    expect(aiChatService.retryMessage).toHaveBeenCalledWith('chat1')
    await act(() => result.current.deleteConversation('other'))
    expect(result.current.activeConversation?.id).toBe('chat1')
    await act(() => result.current.deleteConversation('chat1'))
    expect(result.current.activeConversation).toBeNull()
  })
  it('recovers from history, selection, retry, and deletion failures', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(useAIChat)
    vi.mocked(aiChatService.getConversations).mockRejectedValueOnce(new Error('Offline'))
    await act(() => result.current.loadHistory())
    vi.mocked(aiChatService.getActiveConversation).mockRejectedValueOnce(new Error('Offline'))
    await act(() => result.current.loadActiveConversation())
    vi.mocked(aiChatService.getConversation).mockRejectedValueOnce(new Error('Offline'))
    await act(() => result.current.selectConversation('bad'))
    expect(result.current.activeConversation).toBeNull()
    await act(() => result.current.selectConversation('chat1'))
    vi.mocked(aiChatService.retryMessage).mockRejectedValueOnce({})
    await act(() => result.current.retryLastMessage())
    expect(result.current.error).toBe('Gagal memproses ulang jawaban.')
    vi.mocked(aiChatService.deleteConversation).mockRejectedValueOnce(new Error('Offline'))
    await act(() => result.current.deleteConversation('chat1'))
    expect(result.current.activeConversation?.id).toBe('chat1')
    expect(log).toHaveBeenCalled()
  })
})
