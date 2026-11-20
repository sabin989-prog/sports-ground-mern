import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { requireRole } from '../src/middleware/auth.js';

const valid = {
  name: 'Anna',
  email: 'anna@x.com',
  phone: '9800000000',
  password: 'Str0ng-Pass-123',
};

const register = (body = valid) => request(app).post('/api/auth/register').send(body);

describe('register', () => {
  it('creates a user and sets an httpOnly cookie', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('anna@x.com');
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=.*HttpOnly/i);
  });

  it('stores a hash, never the plain password', async () => {
    await register();
    const user = await User.findOne({ email: 'anna@x.com' }).select('+passwordHash');
    expect(user.passwordHash).not.toBe(valid.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email, ignoring case', async () => {
    await register();
    const res = await register({ ...valid, email: 'ANNA@x.com' });
    expect(res.status).toBe(409);
  });

  it('rejects a short password', async () => {
    const res = await register({ ...valid, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('does not allow choosing an admin role', async () => {
    const res = await register({ ...valid, role: 'admin' });
    expect(res.status).toBe(400);
  });
});

describe('login, me and logout', () => {
  it('logs in and reads /me with the cookie', async () => {
    await register();
    const agent = request.agent(app);
    const login = await agent
      .post('/api/auth/login')
      .send({ email: 'anna@x.com', password: valid.password });
    expect(login.status).toBe(200);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('anna@x.com');
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await register();
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: 'anna@x.com', password: 'Wrong-Pass-123' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@x.com', password: 'Wrong-Pass-123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it('blocks /me without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('blocks /me with a tampered cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('logout ends the session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(valid);
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('requireRole', () => {
  it('allows a matching role', () => {
    const next = vi.fn();
    requireRole('owner')({ user: { role: 'owner' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks a different role with 403', () => {
    const next = vi.fn();
    requireRole('owner')({ user: { role: 'customer' } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
});