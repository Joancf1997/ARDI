import { prisma } from '@/shared/prisma';
import { Conversation } from '@prisma/client';
import { CreateConversationInput, UpdateConversationInput, PaginationParams, } from './conversations.types';


export class ConversationsRepository {
  async findAllByUser(
    userId: string,
    params: PaginationParams
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const skip = (params.page - 1) * params.limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: params.limit,
      }),
      prisma.conversation.count({ where: { userId } }),
    ]);

    return { conversations, total };
  }

  /**
   * Fetch a single conversation by id, including all messages ordered by sequence.
   *
   * TODO: if conversations grow large, add cursor-based pagination on messages.
   */
  async findById(id: string): Promise<Conversation & { messages: any[] } | null> {
    return prisma.conversation.findFirst({
      where: { id },
      include: {
        messages: {
          orderBy: { sequence: 'asc' },
        },
      },
    }) as any;
  }


  async create(userId: string, data: CreateConversationInput): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        userId,
        title: data.title,
      },
    });
  }


  async update(id: string, data: UpdateConversationInput): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
      },
    });
  }


  async delete(id: string): Promise<void> {
    await prisma.conversation.delete({ where: { id } });
  }
}
