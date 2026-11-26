import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const openingHour = z.string().regex(/^([01]\d|2[0-3]):00$/, 'Use a whole hour like 06:00');
const closingHour = z
  .string()
  .regex(/^(([01]\d|2[0-3]):00|24:00)$/, 'Use a whole hour like 22:00, or 24:00');
const hourOf = (t) => Number(t.slice(0, 2));

export const venueQuerySchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  sport: objectId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const venueFields = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).optional(),
});

export const venueCreateSchema = venueFields;
export const venueUpdateSchema = venueFields
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((d) => Object.keys(d).length > 0, 'Nothing to update');

const groundFields = z.object({
  sport: objectId,
  name: z.string().trim().min(1).max(80),
  pricePerHour: z.number().int().min(1).max(1_000_000),
  openingTime: openingHour,
  closingTime: closingHour,
});

export const groundCreateSchema = groundFields.refine(
  (d) => hourOf(d.closingTime) > hourOf(d.openingTime),
  { message: 'Closing time must be after opening time', path: ['closingTime'] }
);
export const groundUpdateSchema = groundFields
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((d) => Object.keys(d).length > 0, 'Nothing to update');