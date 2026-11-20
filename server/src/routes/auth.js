import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/register', authLimiter, asyncHandler(ctrl.register));
router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);

export default router;