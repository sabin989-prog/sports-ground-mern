import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../errors.js';
import { env } from '../config/env.js';
import { TOKEN_TTL_SECONDS } from '../config/auth.js';

const ROUNDS = 12;
// Compared when the email is unknown, so response time does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('dummy-password', ROUNDS);

export async function register({ name, email, phone, password, role }) {
  const passwordHash = await bcrypt.hash(password, ROUNDS);
  try {
    return await User.create({ name, email, phone, passwordHash, role });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Email already registered', 409);
    throw err;
  }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new AppError('Invalid email or password', 401);
  return user;
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}