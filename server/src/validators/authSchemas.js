import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
  password: z.string().min(8).max(72),
  role: z.enum(['customer', 'owner']).default('customer'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});