import * as svc from '../services/venueService.js';
import { AppError } from '../errors.js';
import {
  venueQuerySchema,
  venueCreateSchema,
  venueUpdateSchema,
  groundCreateSchema,
  groundUpdateSchema,
} from '../validators/venueSchemas.js';

export async function listSports(req, res) {
  res.json({ sports: await svc.listSports() });
}
export async function listPublic(req, res) {
  res.json(await svc.listPublicVenues(venueQuerySchema.parse(req.query)));
}
export async function getPublic(req, res) {
  res.json(await svc.getPublicVenue(req.params.id));
}

export async function listMine(req, res) {
  res.json({ venues: await svc.listOwnerVenues(req.user.id) });
}
export async function createVenue(req, res) {
  const venue = await svc.createVenue(req.user.id, venueCreateSchema.parse(req.body));
  res.status(201).json({ venue });
}
export async function updateVenue(req, res) {
  const venue = await svc.updateVenue(req.user.id, req.params.id, venueUpdateSchema.parse(req.body));
  res.json({ venue });
}
export async function uploadImage(req, res) {
  if (!req.file) throw new AppError('Image file is required (field name "image")', 400);
  res.json({ venue: await svc.setVenueImage(req.user.id, req.params.id, req.file.buffer) });
}

export async function listGrounds(req, res) {
  res.json({ grounds: await svc.listOwnerGrounds(req.user.id, req.params.id) });
}
export async function createGround(req, res) {
  const ground = await svc.createGround(req.user.id, req.params.id, groundCreateSchema.parse(req.body));
  res.status(201).json({ ground });
}
export async function updateGround(req, res) {
  const ground = await svc.updateGround(req.user.id, req.params.id, groundUpdateSchema.parse(req.body));
  res.json({ ground });
}