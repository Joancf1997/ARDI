import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginInput } from '@/shared/schemas';

export class AuthController {
  constructor(private authService: AuthService) { }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginInput;
      const tokens = await this.authService.login(email, password);

      // Set refresh token as HTTP-only cookie
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get refresh token from cookie or body
      const refresh_token = req.cookies.refresh_token || req.body.refresh_token;

      if (!refresh_token) {
        return res.status(401).json({
          success: false,
          error: { message: 'No refresh token provided' },
        });
      }

      const tokens = await this.authService.refresh(refresh_token);

      // Set new refresh token as HTTP-only cookie
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token || req.body.refresh_token;

      if (refresh_token) {
        await this.authService.logout(refresh_token);
      }

      res.clearCookie('refresh_token');

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
      }

      const user = await this.authService.getCurrentUser(req.user.user_id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}
