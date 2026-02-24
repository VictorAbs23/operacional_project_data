import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter, forgotPasswordLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '@absolutsport/shared';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/me', authenticate, authController.me);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

export default router;
