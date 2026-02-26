import { Conversation, Message, MessageRole, MessageType, ContentFormat } from '@prisma/client';

export interface ConversationResponse {
  id: string;
  title: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  sequence: number;
  role: MessageRole; 
  type: MessageType;  
  content: string;
  format: ContentFormat; 
  agentRunId: string | null;
  toolCallId: string | null;
  createdAt: Date;
  metadata: unknown;
}

// ─── Request payload types ───────────────────────────────────────────────────

export interface CreateConversationInput {
  title?: string;
}

export interface UpdateConversationInput {
  title?: string;
}

export interface CreateMessageInput {
  content: string;
  conversationId: string;
  role: MessageRole;
  type: MessageType;
  sequence: number;
  format: ContentFormat;
  metadata?: unknown;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedConversations {
  data: ConversationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Send message result ─────────────────────────────────────────────────────

export interface SendMessageResult {
  userMessage: MessageResponse;
  assistantMessage: MessageResponse;
}
