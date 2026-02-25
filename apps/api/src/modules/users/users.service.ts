import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { NotFoundError, ConflictError } from '@/shared/errors';
import { UserResponse, PaginatedUsers, UserListParams } from './users.types';
import { CreateUserInput, UpdateUserInput } from '@/shared/schemas';

export class UserService {
  constructor(private usersRepository: UsersRepository) { }

  async findAll(params: UserListParams): Promise<PaginatedUsers> {
    const { users, total } = await this.usersRepository.findAll(params);

    return {
      data: users.map(this.toUserResponse),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async create(input: CreateUserInput): Promise<UserResponse> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.usersRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role,
      isActive: input.isActive,
    });
    return this.toUserResponse(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserResponse> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new NotFoundError('User not found');

    const user = await this.usersRepository.update(id, {
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      isActive: input.isActive,
    });
    return this.toUserResponse(user);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new NotFoundError('User not found');
    await this.usersRepository.delete(id);
  }

  private toUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
