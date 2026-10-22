import * as React from 'react';
import { aiChatService } from '../services/ai-chat-service';
import type {
  ConversationHeader,
  ConversationDetail,
  AIChatMessage,
} from '../types/ai-chat';
import { useAuthStore } from '@/store/use-auth-store';
import axios from 'axios';

const getSessionStorageKey = (storeId?: string | null) =>
  `ai_active_session_${storeId || 'default'}`;

export function useAIChat() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  const [isOpen, setIsOpen] = React.useState(false);
  const [conversations, setConversations] = React.useState<ConversationHeader[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<ConversationDetail | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [isLoadingActive, setIsLoadingActive] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = React.useState(false);
  const [quotaMessage, setQuotaMessage] = React.useState<string | null>(null);

  // Fetch lightweight list of conversation headers (sessions)
  const loadHistory = React.useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const data = await aiChatService.getConversations(1, 50);
      setConversations(data.items || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Fetch active conversation and its messages
  const loadActiveConversation = React.useCallback(async () => {
    try {
      setIsLoadingActive(true);
      setError(null);
      const data = await aiChatService.getActiveConversation(25);
      setActiveConversation(data);
      if (data?.id) {
        localStorage.setItem(getSessionStorageKey(activeStoreId), data.id);
      }
    } catch (err: any) {
      // 404 is normal when user has never chatted yet
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setActiveConversation(null);
        localStorage.setItem(getSessionStorageKey(activeStoreId), 'new');
      } else {
        console.error('Failed to load active conversation:', err);
      }
    } finally {
      setIsLoadingActive(false);
    }
  }, [activeStoreId]);

  // Select a specific conversation session from list
  const selectConversation = React.useCallback(
    async (id: string) => {
      try {
        setIsLoadingActive(true);
        setError(null);
        const data = await aiChatService.getConversation(id, 25);
        setActiveConversation(data);
        localStorage.setItem(getSessionStorageKey(activeStoreId), id);
      } catch (err: any) {
        console.error('Failed to load conversation:', err);
        // Fallback to new chat if selected session cannot be loaded
        setActiveConversation(null);
        localStorage.setItem(getSessionStorageKey(activeStoreId), 'new');
      } finally {
        setIsLoadingActive(false);
      }
    },
    [activeStoreId]
  );

  // Start new conversation mode (session clean slate)
  const startNewChat = React.useCallback(() => {
    setActiveConversation(null);
    setError(null);
    setQuotaExceeded(false);
    setQuotaMessage(null);
    localStorage.setItem(getSessionStorageKey(activeStoreId), 'new');
  }, [activeStoreId]);

  // When drawer is opened, hydrate session based on saved preference or active conversation
  React.useEffect(() => {
    if (isOpen) {
      loadHistory();
      const savedSessionId = localStorage.getItem(getSessionStorageKey(activeStoreId));
      if (savedSessionId === 'new') {
        setActiveConversation(null);
      } else if (savedSessionId) {
        selectConversation(savedSessionId);
      } else {
        loadActiveConversation();
      }
    }
  }, [isOpen, activeStoreId, loadHistory, loadActiveConversation, selectConversation]);

  // Send message in active conversation or create new thread
  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setIsSending(true);
      setError(null);
      setQuotaExceeded(false);
      setQuotaMessage(null);

      // Optimistic user message
      const tempUserMsg: AIChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      const existingConvId = activeConversation?.id;
      const isExistingConv = Boolean(existingConvId && !existingConvId.startsWith('temp-conv-'));

      // Immediately transform into active conversation so UI switches to conversation view instantly
      const optimisticConv: ConversationDetail = activeConversation
        ? {
            ...activeConversation,
            messages: [...activeConversation.messages, tempUserMsg],
          }
        : {
            id: `temp-conv-${Date.now()}`,
            store_id: activeStoreId || '',
            user_id: '',
            title: trimmed.slice(0, 40),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [tempUserMsg],
          };

      setActiveConversation(optimisticConv);

      try {
        let resp;
        if (isExistingConv && existingConvId) {
          resp = await aiChatService.sendMessage(existingConvId, { message: trimmed });
        } else {
          resp = await aiChatService.createConversation({ message: trimmed });
        }

        const assistantMsg: AIChatMessage = {
          id: resp.message_id,
          role: 'assistant',
          content: resp.content,
          is_error: resp.is_error,
          error_message: resp.error_message,
          created_at: resp.created_at,
        };

        setActiveConversation((prev) => {
          if (!prev) return null;
          const otherMessages = prev.messages.filter((m) => m.id !== tempUserMsg.id);
          return {
            ...prev,
            id: resp.conversation_id,
            title: prev.title || trimmed.slice(0, 40),
            updated_at: resp.created_at,
            messages: [...otherMessages, tempUserMsg, assistantMsg],
          };
        });

        localStorage.setItem(getSessionStorageKey(activeStoreId), resp.conversation_id);

        // Refresh conversation history headers
        await loadHistory();
      } catch (err: any) {
        // Detect quota exceeded error
        const isQuota =
          err?.response?.status === 403 &&
          (err?.response?.data?.errors?.code === 'QUOTA_EXCEEDED' ||
            err?.response?.data?.message?.includes('QUOTA_EXCEEDED'));

        if (isQuota) {
          setQuotaExceeded(true);
          const limit = err?.response?.data?.errors?.limit ?? 10;
          setQuotaMessage(
            `Batas kuota pertanyaan AI hari ini telah tercapai (${limit} pertanyaan/hari). Silakan upgrade paket untuk kuota lebih besar.`
          );
        } else {
          const msg =
            err?.response?.data?.message || err?.message || 'Gagal mengirim pesan ke AI.';
          setError(msg);

          // Inline fallback assistant message with retry button
          const errorAssistantMsg: AIChatMessage = {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Terjadi gangguan saat memproses jawaban. Silakan coba lagi.',
            is_error: true,
            error_message: msg,
            created_at: new Date().toISOString(),
          };

          setActiveConversation((prev) =>
            prev ? { ...prev, messages: [...prev.messages, errorAssistantMsg] } : prev
          );
        }
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation, isSending, activeStoreId, loadHistory]
  );

  // Delete conversation
  const deleteConversation = React.useCallback(
    async (id: string) => {
      try {
        await aiChatService.deleteConversation(id);
        if (activeConversation?.id === id) {
          startNewChat();
        }
        await loadHistory();
      } catch (err) {
        console.error('Failed to delete conversation:', err);
      }
    },
    [activeConversation, loadHistory, startNewChat]
  );

  // Retry last message in active conversation
  const retryLastMessage = React.useCallback(async () => {
    if (!activeConversation?.id || isSending) return;

    setIsSending(true);
    setError(null);

    // Filter out previous error message if present
    setActiveConversation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.filter((m) => !m.is_error),
      };
    });

    try {
      let resp;
      if (activeConversation.id.startsWith('temp-conv-')) {
        const lastUserMsg = [...activeConversation.messages].reverse().find((m) => m.role === 'user');
        if (!lastUserMsg) return;
        resp = await aiChatService.createConversation({ message: lastUserMsg.content });
      } else {
        resp = await aiChatService.retryMessage(activeConversation.id);
      }

      const assistantMsg: AIChatMessage = {
        id: resp.message_id,
        role: 'assistant',
        content: resp.content,
        is_error: resp.is_error,
        error_message: resp.error_message,
        created_at: resp.created_at,
      };

      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: resp.conversation_id,
          updated_at: resp.created_at,
          messages: [...prev.messages, assistantMsg],
        };
      });

      localStorage.setItem(getSessionStorageKey(activeStoreId), resp.conversation_id);
      await loadHistory();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal memproses ulang jawaban.');
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, isSending, activeStoreId, loadHistory]);

  return {
    isOpen,
    setIsOpen,
    conversations,
    activeConversation,
    isLoadingHistory,
    isLoadingActive,
    isSending,
    error,
    quotaExceeded,
    quotaMessage,
    loadHistory,
    loadActiveConversation,
    selectConversation,
    startNewChat,
    sendMessage,
    retryLastMessage,
    deleteConversation,
  };
}
