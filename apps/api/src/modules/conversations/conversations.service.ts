import { ConversationsRepository } from './conversations.repository';
import { NotFoundError, ForbiddenError } from '@/shared/errors';
import {
  ConversationResponse,
  MessageResponse,
  CreateConversationInput,
  UpdateConversationInput,
  CreateMessageInput,
  PaginationParams,
  PaginatedConversations,
  SendMessageResult,
} from './conversations.types';
import { prisma } from '@/shared/prisma';


export class ConversationsService {
  constructor(private repo: ConversationsRepository) { }

  // ── List ──────────────────────────────────────────────────────────────────
  async findAll(userId: string, params: PaginationParams): Promise<PaginatedConversations> {
    const { conversations, total } = await this.repo.findAllByUser(userId, params);

    return {
      data: conversations.map(this.toConversationResponse),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  // ── Get one ───────────────────────────────────────────────────────────────
  async findOne(id: string, userId: string): Promise<ConversationResponse & { messages: MessageResponse[] }> {
    const conv = await this.repo.findById(id);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError();

    return {
      ...this.toConversationResponse(conv),
      messages: (conv as any).messages.map(this.toMessageResponse),
    };
  }

  // ── Create ────────────────────────────────────────────────────────────────
  async create(userId: string, input: CreateConversationInput): Promise<ConversationResponse> {
    const conv = await this.repo.create(userId, input);
    return this.toConversationResponse(conv);
  }

  // ── Update title ──────────────────────────────────────────────────────────
  async update(id: string, userId: string, input: UpdateConversationInput): Promise<ConversationResponse> {
    const conv = await this.repo.findById(id);
    console.log("conversation")
    console.log("conversatoin id: " + id)
    console.log(conv);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError();

    const updated = await this.repo.update(id, input);
    return this.toConversationResponse(updated);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async remove(id: string, userId: string): Promise<void> {
    const conv = await this.repo.findById(id);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError();
    await this.repo.delete(id);
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async *sendMessageStream(
    conversationId: string,
    userId: string,
    input: CreateMessageInput
  ): AsyncGenerator<any, void, unknown> {
    const conv = await this.repo.findById(conversationId);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError();

    const sequence = input.sequence;

    // 1. Persist the user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: input.role || 'USER',
        content: input.content,
        sequence: sequence,
        type: input.type || 'CHAT',
        format: input.format || 'TEXT',
        metadata: input.metadata || {},
      }
    });

    yield { type: 'user_message', message: this.toMessageResponse(userMessage) };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // 2. Mock Tool Call (Thinking)
    await delay(500);
    const toolCallId = "msg-" + Date.now();
    const toolCallMsg = {
      id: toolCallId,
      conversationId,
      role: 'ASSISTANT',
      type: 'TOOL_CALL',
      content: JSON.stringify({ tool: "generate_report", args: { month: "January", year: 2026, scope: "all_clients" } }),
      format: 'JSON',
      sequence: sequence + 1,
      createdAt: new Date().toISOString()
    };
    yield { type: 'agent_message', message: toolCallMsg };

    // 3. Mock Tool Result
    await delay(1200);
    const toolResultId = "msg-" + (Date.now() + 1);
    const toolResultMsg = {
      id: toolResultId,
      conversationId,
      role: 'TOOL',
      type: 'TOOL_RESULT',
      content: JSON.stringify({ status: "success", reportUrl: "/reports/jan-2026.pdf", clientsProcessed: 47 }),
      format: 'JSON',
      sequence: sequence + 2,
      createdAt: new Date().toISOString()
    };
    yield { type: 'agent_message', message: toolResultMsg };

    // 4. Mock Streaming Chat Response
    await delay(500);
    const chatId = "msg-" + (Date.now() + 2);
    const chatMsgBase = {
      id: chatId,
      conversationId,
      role: 'ASSISTANT',
      type: 'CHAT',
      format: 'MARKDOWN',
      sequence: sequence + 3,
      createdAt: new Date().toISOString()
    };

    yield { type: 'agent_message_start', message: { ...chatMsgBase, content: "" } };

    const textToStream = "I've successfully generated the report for January 2026 across all clients.\n\nA total of **47 clients** were processed, and the PDF is ready for download. Would you like me to extract any specific insights from this report directly into our chat?";
    // Split by words to simulate token streaming
    const tokens = textToStream.match(/(\s+|\S+)/g) || [];

    let accumulatedContent = "";
    for (const token of tokens) {
      await delay(40);
      accumulatedContent += token;
      yield { type: 'agent_message_chunk', messageId: chatId, delta: token };
    }

    // 5. Persist the mock agent messages
    await prisma.message.createMany({
      data: [
        { id: toolCallId, conversationId, role: 'ASSISTANT', type: 'TOOL_CALL', format: 'JSON', content: toolCallMsg.content, sequence: toolCallMsg.sequence },
        { id: toolResultId, conversationId, role: 'TOOL', type: 'TOOL_RESULT', format: 'JSON', content: toolResultMsg.content, sequence: toolResultMsg.sequence },
        { id: chatId, conversationId, role: 'ASSISTANT', type: 'CHAT', format: 'MARKDOWN', content: accumulatedContent, sequence: chatMsgBase.sequence }
      ]
    });
  }

  // ── Private mappers ───────────────────────────────────────────────────────

  private toConversationResponse(conv: any): ConversationResponse {
    return {
      id: conv.id,
      title: conv.title,
      userId: conv.userId,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  private toMessageResponse(msg: any): MessageResponse {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      sequence: msg.sequence,
      role: msg.role,
      type: msg.type,
      content: msg.content,
      format: msg.format,
      agentRunId: msg.agentRunId ?? null,
      toolCallId: msg.toolCallId ?? null,
      createdAt: msg.createdAt,
      metadata: msg.metadata ?? null,
    };
  }
}
