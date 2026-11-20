import User from '../models/User.js';
import { AppError } from '../errors.js';
import { COOKIE_NAME } from '../config/auth.js';
import { verifyToken } from '../services/authService.js';
import { asyncHandler } from './asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Authentication required', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('Authentication required', 401);
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError('Forbidden', 403));