import * as authService from '../services/authService.js';
import { registerSchema, loginSchema } from '../validators/authSchemas.js';
import { COOKIE_NAME, TOKEN_TTL_SECONDS, authCookieOptions } from '../config/auth.js';

function startSession(res, user, status) {
  res.cookie(COOKIE_NAME, authService.signToken(user), {
    ...authCookieOptions,
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
  res.status(status).json({ user });
}

export async function register(req, res) {
  const user = await authService.register(registerSchema.parse(req.body));
  startSession(res, user, 201);
}

export async function login(req, res) {
  const user = await authService.login(loginSchema.parse(req.body));
  startSession(res, user, 200);
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, authCookieOptions);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user });
}