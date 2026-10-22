export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AIChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  tool_calls?: any;
  tool_call_id?: string;
  is_error?: boolean;
  error_message?: string;
  created_at: string;
}

export interface ConversationHeader {
  id: string;
  title: string;
  message_count: number;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: AIChatMessage[];
}

export interface CreateConversationPayload {
  message: string;
  title?: string;
}

export interface SendMessagePayload {
  message: string;
}

export interface AIChatResponse {
  conversation_id: string;
  message_id: string;
  role: string;
  content: string;
  is_error?: boolean;
  error_message?: string;
  created_at: string;
}

export interface PaginatedConversations {
  items: ConversationHeader[];
  total: number;
  page: number;
  limit: number;
}
