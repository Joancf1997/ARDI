import { Router } from 'express';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';
import { authenticate } from '@/middlewares/auth.middleware';
import { updateConversationSchema, createConversationSchema, userMessageSchema } from '@/shared/schemas';
import { validate } from '@/middlewares/validation.middleware';

const router = Router();

// ── Dependency wiring ────────────────────────────────────────────────────────
const repository = new ConversationsRepository();
const service = new ConversationsService(repository);
const controller = new ConversationsController(service);

// All conversation routes require a logged-in user
router.use(authenticate);

// ── Routes ───────────────────────────────────────────────────────────────────
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.post('/', validate(createConversationSchema), controller.create);
router.patch('/:id', validate(updateConversationSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/userMessages', validate(userMessageSchema), controller.sendMessage);

export default router;
