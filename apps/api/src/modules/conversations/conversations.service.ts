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

  /**
   * TODO: This is the most important method to implement.
   *
   * STEP-BY-STEP GUIDE
   * 3. Invoke the AI agent.
   *    You'll need an AgentRunner or similar class. It receives the full
   *    conversation history and returns the assistant reply. Example:
   *    const agentResult = await this.agentRunner.run(conversationId, userId);
   *
   * 4. Persist the assistant's message returned by the agent.
   *    const assistantMsg = await prisma.message.create({ data: { ... } });
   *
   * 5. Optionally update the conversation title from the first user message:
   *    if (isFirstMessage) {
   *      await this.repo.update(conversationId, { title: input.content.slice(0, 60) });
   *    }
   *
   * 6. Return { userMessage, assistantMessage } — the frontend appends both.
   *
   * For now this method throws NotImplementedError so the frontend knows
   * to keep using the mock. Remove this once steps 2-4 are done.
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    input: CreateMessageInput
  ): Promise<SendMessageResult> {
    const conv = await this.repo.findById(conversationId);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError();

    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: input.role,
        content: input.content,
        sequence: input.sequence,
        type: input.type,
        format: input.format,
        metadata: input.metadata || {},
      }
    })

    // Invoke the AI agent.

    //  Persist the assistant's message returned by the agent.
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: "Test assistant reply",
        sequence: input.sequence + 1,
        type: input.type,
        format: input.format,
        metadata: input.metadata || {},
      }
    })

    return {
      userMessage: this.toMessageResponse(userMessage),
      assistantMessage: this.toMessageResponse(assistantMessage)
    };
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
