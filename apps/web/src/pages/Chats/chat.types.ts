// Mirrors the Prisma schema enums and models

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
export type MessageType = 'CHAT' | 'TOOL_CALL' | 'TOOL_RESULT' | 'SYSTEM_EVENT';
export type ContentFormat = 'TEXT' | 'JSON' | 'MARKDOWN' | 'STREAM';
export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type AgentType =
  | 'PLANER_AGENT'
  | 'RESPONSE_AGENT'
  | 'DIRECT_RESPONSE_AGENT'
  | 'NARRATIVE_AGENT';

export interface Conversation {
  id: string;
  title: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  metadata?: Record<string, unknown>;
}

export interface UserMessage {
  conversationId: string;
  sequence: number;
  role: MessageRole;
  type: MessageType;
  content: string;
  format: ContentFormat;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversationId: string;
  sequence: number;
  role: MessageRole;
  type: MessageType;
  content: string;
  format: ContentFormat;
  agentRunId?: string | null;
  toolCallId?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRun {
  id: string;
  conversationId: string;
  agentId: string;
  status: RunStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  createdAt: string;
}
