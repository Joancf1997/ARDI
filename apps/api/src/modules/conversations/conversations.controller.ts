import { Request, Response, NextFunction } from 'express';
import { ConversationsService } from './conversations.service';
import { CreateConversationInput, UpdateConversationInput, CreateMessageInput } from './conversations.types';

export class ConversationsController {
  constructor(private service: ConversationsService) { }

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await this.service.findAll(userId, { page, limit });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const conversation = await this.service.findOne(id, userId);
      res.json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const input = req.body as unknown as CreateConversationInput;

      const conversation = await this.service.create(userId, input);
      res.status(201).json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const title = req.body as unknown as UpdateConversationInput;

      const conversation = await this.service.update(id, userId, title);
      res.json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await this.service.remove(id, userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const input = req.body as CreateMessageInput;
      
      const result = await this.service.sendMessage(id, userId, input);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
