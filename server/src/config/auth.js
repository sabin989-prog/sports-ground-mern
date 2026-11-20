import { env } from './env.js';

export const COOKIE_NAME = 'token';
export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};