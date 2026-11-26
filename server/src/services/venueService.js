import { randomBytes } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import Sport from '../models/Sport.js';
import Venue from '../models/Venue.js';
import Ground from '../models/Ground.js';
import { AppError } from '../errors.js';
import { env } from '../config/env.js';

const notFound = () => new AppError('Not found', 404);
const isId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hourOf = (t) => Number(t.slice(0, 2));

export const listSports = () => Sport.find().sort({ name: 1 });

// ---- public ----
export async function listPublicVenues({ city, sport, page, limit }) {
  const groundFilter = { isActive: true };
  if (sport) groundFilter.sport = sport;
  const venueIds = await Ground.distinct('venue', groundFilter);

  const filter = { isActive: true, _id: { $in: venueIds } };
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');

  const [items, total] = await Promise.all([
    Venue.find(filter).select('-owner').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Venue.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getPublicVenue(id) {
  if (!isId(id)) throw notFound();
  const venue = await Venue.findOne({ _id: id, isActive: true }).select('-owner');
  if (!venue) throw notFound();
  const grounds = await Ground.find({ venue: id, isActive: true }).populate('sport').sort({ name: 1 });
  return { venue, grounds };
}

// ---- owner: venues ----
async function getOwnedVenue(ownerId, venueId) {
  if (!isId(venueId)) throw notFound();
  const venue = await Venue.findOne({ _id: venueId, owner: ownerId }); // 404, never 403: do not reveal it exists
  if (!venue) throw notFound();
  return venue;
}

export const listOwnerVenues = (ownerId) => Venue.find({ owner: ownerId }).sort({ createdAt: -1 });

export const createVenue = (ownerId, data) => Venue.create({ ...data, owner: ownerId });

export async function updateVenue(ownerId, venueId, data) {
  const venue = await getOwnedVenue(ownerId, venueId);
  venue.set(data);
  return venue.save();
}

function detectImageType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp';
  }
  return null;
}

export async function setVenueImage(ownerId, venueId, buffer) {
  const venue = await getOwnedVenue(ownerId, venueId);
  const ext = detectImageType(buffer); // check the real bytes, not the name or the browser's claim
  if (!ext) throw new AppError('Only JPEG, PNG or WebP images are allowed', 400);

  const dir = path.join(env.MEDIA_ROOT, 'venues');
  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(16).toString('hex')}.${ext}`;
  await writeFile(path.join(dir, name), buffer);

  if (venue.image) await unlink(path.join(dir, path.basename(venue.image))).catch(() => {});
  venue.image = `/media/venues/${name}`;
  return venue.save();
}

// ---- owner: grounds ----
function rethrowDuplicate(err) {
  if (err.code === 11000) {
    throw new AppError('A ground with this name already exists in this venue', 409);
  }
  throw err;
}

async function assertSport(id) {
  if (!(await Sport.exists({ _id: id }))) throw new AppError('Unknown sport', 400);
}

export async function listOwnerGrounds(ownerId, venueId) {
  const venue = await getOwnedVenue(ownerId, venueId);
  return Ground.find({ venue: venue._id }).populate('sport').sort({ name: 1 });
}

export async function createGround(ownerId, venueId, data) {
  const venue = await getOwnedVenue(ownerId, venueId);
  await assertSport(data.sport);
  try {
    return await Ground.create({ ...data, venue: venue._id });
  } catch (err) {
    rethrowDuplicate(err);
  }
}

export async function updateGround(ownerId, groundId, data) {
  if (!isId(groundId)) throw notFound();
  const ground = await Ground.findById(groundId);
  if (!ground || !(await Venue.exists({ _id: ground.venue, owner: ownerId }))) throw notFound();

  if (data.sport && String(data.sport) !== String(ground.sport)) await assertSport(data.sport);
  ground.set(data);
  if (hourOf(ground.closingTime) <= hourOf(ground.openingTime)) {
    throw new AppError('Closing time must be after opening time', 400);
  }
  try {
    return await ground.save();
  } catch (err) {
    rethrowDuplicate(err);
  }
}