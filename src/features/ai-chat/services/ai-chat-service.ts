import apiClient from '@/lib/api-client';
import type {
  ConversationDetail,
  PaginatedConversations,
  CreateConversationPayload,
  SendMessagePayload,
  AIChatResponse,
} from '../types/ai-chat';

export const aiChatService = {
  async getConversations(page = 1, limit = 20): Promise<PaginatedConversations> {
    const res = await apiClient.get<PaginatedConversations>('/store/ai/conversations', {
      params: { page, limit },
    });
    return res.data;
  },

  async getActiveConversation(limit = 20): Promise<ConversationDetail> {
    const res = await apiClient.get<ConversationDetail>('/store/ai/conversations/active', {
      params: { limit },
    });
    return res.data;
  },

  async getConversation(id: string, limit = 20, before?: string): Promise<ConversationDetail> {
    const res = await apiClient.get<ConversationDetail>(`/store/ai/conversations/${id}`, {
      params: { limit, before },
    });
    return res.data;
  },

  async createConversation(payload: CreateConversationPayload): Promise<AIChatResponse> {
    const res = await apiClient.post<AIChatResponse>('/store/ai/conversations', payload);
    return res.data;
  },

  async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<AIChatResponse> {
    const res = await apiClient.post<AIChatResponse>(
      `/store/ai/conversations/${conversationId}/messages`,
      payload
    );
    return res.data;
  },

  async retryMessage(conversationId: string): Promise<AIChatResponse> {
    const res = await apiClient.post<AIChatResponse>(
      `/store/ai/conversations/${conversationId}/retry`
    );
    return res.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/store/ai/conversations/${id}`);
  },
};
