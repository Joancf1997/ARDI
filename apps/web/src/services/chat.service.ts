import apiClient from './api';
import { Conversation, Message } from '@/pages/Chats/chat.types';
import { useAuthStore } from '@/stores/auth.store';

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
   * Streaming implementation using fetch and ReadableStream
   */
  async sendMessageStream(
    conversationId: string,
    payload: any,
    onChunk: (chunk: any) => void
  ): Promise<void> {
    const authStore = useAuthStore();
    const token = authStore.accessToken;
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    const response = await fetch(`${baseURL}/conversations/${conversationId}/userMessages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to send message. Server responded with ${response.status}`);
    }
    if (!response.body) throw new Error("No readable stream in response");

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep the last partial line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') return;
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            onChunk(parsed);
          } catch (e) {
            console.error('SSE JSON parse error:', e, dataStr);
          }
        }
      }
    }
  },
};
