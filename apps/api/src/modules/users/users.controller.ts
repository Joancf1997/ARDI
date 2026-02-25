import { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';
import { UserRole } from '@prisma/client';
import { UnauthorizedError } from '@/shared/errors';
import { UserFilterInput, CreateUserInput, UpdateUserInput } from '@/shared/schemas';

export class UserController {
  constructor(private userService: UserService) { }

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = req.query as unknown as UserFilterInput;
      const result = await this.userService.findAll({
        role: filter.role,
        page: filter.page || 1,
        limit: filter.limit || 20,
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as CreateUserInput;

      let userRole = req.user?.role;
      if (userRole !== UserRole.ADMIN) {
        throw new UnauthorizedError('You are not authorized to perform this action');
      }

      const user = await this.userService.create(input);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      let userRole = req.user?.role;
      if (userRole !== UserRole.ADMIN) {
        throw new UnauthorizedError('You are not authorized to perform this action');
      }

      const input = req.body as UpdateUserInput;
      const user = await this.userService.update(id, input);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      let userRole = req.user?.role;
      if (userRole !== UserRole.ADMIN) {
        throw new UnauthorizedError('You are not authorized to perform this action');
      }

      await this.userService.remove(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
