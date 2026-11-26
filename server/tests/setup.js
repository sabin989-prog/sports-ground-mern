import { beforeAll, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Sport from '../src/models/Sport.js';
import Venue from '../src/models/Venue.js';
import Ground from '../src/models/Ground.js';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.init(), Sport.init(), Venue.init(), Ground.init()]);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
