import { beforeAll, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.init(); // makes sure the unique email index exists
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});