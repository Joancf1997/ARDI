import apiClient from './api';
import { Conversation, Message } from '@/pages/Chats/chat.types';

// ─── Response envelope shapes (match whatever your backend returns) ─────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ConversationsListResponse {
  success: boolean;
  data: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Request payload types ───────────────────────────────────────────────────

export interface CreateConversationPayload {
  title?: string;
}

export interface SendMessagePayload {
  content: string;
}

// ─── Conversation endpoints ──────────────────────────────────────────────────
export const chatService = {
  async getConversations(): Promise<ConversationsListResponse> {
    const response = await apiClient.get<ConversationsListResponse>('/conversations');
    return response.data;
  },

  async getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
    const response = await apiClient.get<ApiResponse<Conversation & { messages: Message[] }>>(`/conversations/${id}`);
    return response.data.data;
  },


  async createConversation(payload: CreateConversationPayload = {}): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation>>('/conversations', payload);
    return response.data.data;
  },


  async updateConversationTitle(id: string, title: string) {
    const response = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${id}`, { title });
    return response.data.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/conversations/${id}`);
  },

  // ─── Message endpoints ─────────────────────────────────────────────────────
  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/conversations/${conversationId}/messages`
    );
    return response.data.data;
  },

  /**
   * Modify to Streaming in the future:
   *   The backend returns a stream (SSE or chunked transfer). The frontend
   *   appends chunks to the assistant message as they arrive.
   *   → You'll need to switch to `fetch` with ReadableStream instead of Axios.
   */
  async sendMessage(
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const response = await apiClient.post<ApiResponse<{ userMessage: Message; assistantMessage: Message }>>(`/conversations/${conversationId}/userMessages`, payload);
    return {
      userMessage: response.data.data.userMessage,
      assistantMessage: response.data.data.assistantMessage
    }
  },
};
