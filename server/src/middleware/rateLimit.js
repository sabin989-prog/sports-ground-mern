import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Stage 12 (behind Nginx): add app.set('trust proxy', 1) so the real client IP is used
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: 'Too many attempts. Try again later.' },
});