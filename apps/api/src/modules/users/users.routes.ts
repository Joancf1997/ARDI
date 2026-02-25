import { Router } from 'express';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { UsersRepository } from './users.repository';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate, validateQuery } from '@/middlewares/validation.middleware';
import { userFilterSchema, createUserSchema, updateUserSchema } from '@/shared/schemas';

const router = Router();

// Dependencies
const userRepository = new UsersRepository();
const usersService = new UserService(userRepository);
const usersController = new UserController(usersService);

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', validateQuery(userFilterSchema), usersController.findAll);
router.post('/', validate(createUserSchema), usersController.create);
router.put('/:id', validate(updateUserSchema), usersController.update);
router.delete('/:id', usersController.remove);

export default router;
