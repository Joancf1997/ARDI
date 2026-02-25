import { prisma } from '@/shared/prisma';
import { User } from '@prisma/client';
import { UserListParams, CreateUserData, UpdateUserData } from './users.types';

export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id },
    });
  }

  async findAll(params: UserListParams): Promise<{ users: User[]; total: number }> {
    const { role, page, limit } = params;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { role } }),
    ]);

    return { users, total };
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
