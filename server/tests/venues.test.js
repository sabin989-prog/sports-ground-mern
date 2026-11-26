import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import app from '../src/app.js';
import Sport from '../src/models/Sport.js';

let n = 0;
async function agentFor(role) {
  n += 1;
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({
    name: `User ${n}`,
    email: `user${n}@x.com`,
    phone: '9800000000',
    password: 'Str0ng-Pass-123',
    role,
  });
  expect(res.status).toBe(201);
  return agent;
}

const venueBody = { name: 'Hetauda Sports Hub', address: 'Main Road', city: 'Hetauda' };
const groundBody = (sportId, over = {}) => ({
  sport: sportId,
  name: 'Court 1',
  pricePerHour: 800,
  openingTime: '06:00',
  closingTime: '22:00',
  ...over,
});

async function makeVenue(agent, over = {}) {
  const res = await agent.post('/api/owner/venues').send({ ...venueBody, ...over });
  expect(res.status).toBe(201);
  return res.body.venue;
}
async function makeGround(agent, venueId, sport, over = {}) {
  const res = await agent.post(`/api/owner/venues/${venueId}/grounds`).send(groundBody(sport.id, over));
  expect(res.status).toBe(201);
  return res.body.ground;
}

let futsal;
let badminton;
beforeEach(async () => {
  futsal = await Sport.create({ name: 'Futsal', category: 'outdoor' });
  badminton = await Sport.create({ name: 'Badminton', category: 'indoor' });
});

const FAKE_ID = '507f1f77bcf86cd799439011';

describe('owner venues', () => {
  it('creates a venue owned by the logged-in owner', async () => {
    const owner = await agentFor('owner');
    const me = (await owner.get('/api/auth/me')).body.user;
    const res = await owner.post('/api/owner/venues').send(venueBody);
    expect(res.status).toBe(201);
    expect(res.body.venue.owner).toBe(me.id);
    expect(res.body.venue.isActive).toBe(true);
  });

  it('blocks customers (403) and anonymous users (401)', async () => {
    const customer = await agentFor('customer');
    expect((await customer.post('/api/owner/venues').send(venueBody)).status).toBe(403);
    expect((await request(app).post('/api/owner/venues').send(venueBody)).status).toBe(401);
  });

  it('ignores owner and isActive sent in the body', async () => {
    const owner = await agentFor('owner');
    const me = (await owner.get('/api/auth/me')).body.user;
    const res = await owner.post('/api/owner/venues').send({ ...venueBody, owner: FAKE_ID, isActive: false });
    expect(res.status).toBe(201);
    expect(res.body.venue.owner).toBe(me.id);
    expect(res.body.venue.isActive).toBe(true);
  });

  it('rejects invalid input', async () => {
    const owner = await agentFor('owner');
    expect((await owner.post('/api/owner/venues').send({ ...venueBody, name: '' })).status).toBe(400);
  });

  it("does not let an owner edit another owner's venue", async () => {
    const a = await agentFor('owner');
    const b = await agentFor('owner');
    const venue = await makeVenue(a);
    const res = await b.patch(`/api/owner/venues/${venue.id}`).send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it("lists only the owner's own venues, including inactive ones", async () => {
    const a = await agentFor('owner');
    const b = await agentFor('owner');
    const mine = await makeVenue(a, { name: 'Mine' });
    await makeVenue(b, { name: 'Theirs' });
    await a.patch(`/api/owner/venues/${mine.id}`).send({ isActive: false });
    const res = await a.get('/api/owner/venues');
    expect(res.body.venues.map((v) => v.name)).toEqual(['Mine']);
  });

  it('deactivates a venue instead of deleting it', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const res = await owner.patch(`/api/owner/venues/${venue.id}`).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.venue.isActive).toBe(false);
    expect((await owner.get('/api/owner/venues')).body.venues).toHaveLength(1);
  });
});

describe('owner grounds', () => {
  it('creates a ground in the own venue', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const ground = await makeGround(owner, venue.id, futsal);
    expect(ground.venue).toBe(venue.id);
    expect(ground.pricePerHour).toBe(800);
  });

  it('rejects a duplicate name in one venue but allows it in another', async () => {
    const owner = await agentFor('owner');
    const v1 = await makeVenue(owner);
    const v2 = await makeVenue(owner, { name: 'Second Venue' });
    await makeGround(owner, v1.id, futsal);
    const dup = await owner.post(`/api/owner/venues/${v1.id}/grounds`).send(groundBody(futsal.id));
    expect(dup.status).toBe(409);
    await makeGround(owner, v2.id, futsal);
  });

  it.each([
    ['closing before opening', { openingTime: '10:00', closingTime: '09:00' }],
    ['a half-hour opening time', { openingTime: '06:30' }],
    ['a decimal price', { pricePerHour: 800.5 }],
    ['an unknown sport', { sport: FAKE_ID }],
  ])('rejects %s', async (_label, over) => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const res = await owner
      .post(`/api/owner/venues/${venue.id}/grounds`)
      .send(groundBody(futsal.id, over));
    expect(res.status).toBe(400);
  });

  it("does not let another owner add a ground to someone's venue", async () => {
    const a = await agentFor('owner');
    const b = await agentFor('owner');
    const venue = await makeVenue(a);
    const res = await b.post(`/api/owner/venues/${venue.id}/grounds`).send(groundBody(futsal.id));
    expect(res.status).toBe(404);
  });

  it("does not let another owner update someone's ground", async () => {
    const a = await agentFor('owner');
    const b = await agentFor('owner');
    const venue = await makeVenue(a);
    const ground = await makeGround(a, venue.id, futsal);
    const res = await b.patch(`/api/owner/grounds/${ground.id}`).send({ pricePerHour: 1 });
    expect(res.status).toBe(404);
  });

  it('lets the owner change the price and deactivate a ground', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const ground = await makeGround(owner, venue.id, futsal);
    const res = await owner
      .patch(`/api/owner/grounds/${ground.id}`)
      .send({ pricePerHour: 1000, isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.ground.pricePerHour).toBe(1000);
    expect(res.body.ground.isActive).toBe(false);
  });

  it('rejects an update that makes closing time earlier than opening', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const ground = await makeGround(owner, venue.id, futsal);
    const res = await owner.patch(`/api/owner/grounds/${ground.id}`).send({ openingTime: '23:00' });
    expect(res.status).toBe(400);
  });
});

describe('public browsing', () => {
  it('lists only active venues with an active ground, without the owner', async () => {
    const owner = await agentFor('owner');
    const good = await makeVenue(owner, { name: 'Good Venue' });
    await makeGround(owner, good.id, futsal);
    await makeVenue(owner, { name: 'No Grounds' });
    const hidden = await makeVenue(owner, { name: 'Hidden' });
    await makeGround(owner, hidden.id, futsal);
    await owner.patch(`/api/owner/venues/${hidden.id}`).send({ isActive: false });
    const quiet = await makeVenue(owner, { name: 'Inactive Ground' });
    const g = await makeGround(owner, quiet.id, futsal);
    await owner.patch(`/api/owner/grounds/${g.id}`).send({ isActive: false });

    const res = await request(app).get('/api/venues');
    expect(res.status).toBe(200);
    expect(res.body.items.map((v) => v.name)).toEqual(['Good Venue']);
    expect(res.body.items[0].owner).toBeUndefined();
    expect(res.body.total).toBe(1);
  });

  it('filters by city (ignoring case) and by sport', async () => {
    const owner = await agentFor('owner');
    const v1 = await makeVenue(owner, { name: 'Hub', city: 'Hetauda' });
    await makeGround(owner, v1.id, futsal);
    const v2 = await makeVenue(owner, { name: 'Green Turf', city: 'Kathmandu' });
    await makeGround(owner, v2.id, badminton);

    const byCity = await request(app).get('/api/venues?city=hetauda');
    expect(byCity.body.items.map((v) => v.name)).toEqual(['Hub']);
    const bySport = await request(app).get(`/api/venues?sport=${badminton.id}`);
    expect(bySport.body.items.map((v) => v.name)).toEqual(['Green Turf']);
    expect((await request(app).get('/api/venues?sport=abc')).status).toBe(400);
  });

  it('shows venue detail with active grounds only', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    await makeGround(owner, venue.id, futsal);
    const second = await makeGround(owner, venue.id, futsal, { name: 'Court 2' });
    await owner.patch(`/api/owner/grounds/${second.id}`).send({ isActive: false });

    const res = await request(app).get(`/api/venues/${venue.id}`);
    expect(res.status).toBe(200);
    expect(res.body.grounds.map((g) => g.name)).toEqual(['Court 1']);
    expect(res.body.grounds[0].sport.name).toBe('Futsal');
    expect(res.body.venue.owner).toBeUndefined();
  });

  it('returns 404 for inactive, unknown and malformed venue ids', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    await owner.patch(`/api/owner/venues/${venue.id}`).send({ isActive: false });
    expect((await request(app).get(`/api/venues/${venue.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/venues/${FAKE_ID}`)).status).toBe(404);
    expect((await request(app).get('/api/venues/abc')).status).toBe(404);
  });

  it('lists the sports', async () => {
    const res = await request(app).get('/api/sports');
    expect(res.body.sports.map((s) => s.name)).toEqual(['Badminton', 'Futsal']);
  });
});

describe('venue image', () => {
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64),
  ]);

  it('accepts a real PNG and stores it in the media folder', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const res = await owner.post(`/api/owner/venues/${venue.id}/image`).attach('image', PNG, 'a.png');
    expect(res.status).toBe(200);
    expect(res.body.venue.image).toMatch(/^\/media\/venues\/[a-f0-9]{32}\.png$/);
    const file = path.join(process.env.MEDIA_ROOT, 'venues', path.basename(res.body.venue.image));
    expect(existsSync(file)).toBe(true);
  });

  it('rejects a text file renamed to .png', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const fake = Buffer.from('this is not an image, just text pretending');
    const res = await owner.post(`/api/owner/venues/${venue.id}/image`).attach('image', fake, 'a.png');
    expect(res.status).toBe(400);
  });

  it('rejects a file over 2 MB', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    const res = await owner.post(`/api/owner/venues/${venue.id}/image`).attach('image', big, 'big.png');
    expect(res.status).toBe(400);
  });

  it('rejects a request with no file', async () => {
    const owner = await agentFor('owner');
    const venue = await makeVenue(owner);
    const res = await owner.post(`/api/owner/venues/${venue.id}/image`);
    expect(res.status).toBe(400);
  });

  it("does not let another owner change a venue's image", async () => {
    const a = await agentFor('owner');
    const b = await agentFor('owner');
    const venue = await makeVenue(a);
    const res = await b.post(`/api/owner/venues/${venue.id}/image`).attach('image', PNG, 'a.png');
    expect(res.status).toBe(404);
  });
});