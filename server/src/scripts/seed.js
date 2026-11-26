import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Sport from '../models/Sport.js';

const SPORTS = [
  { name: 'Futsal', category: 'outdoor' },
  { name: 'Cricket', category: 'outdoor' },
  { name: 'Basketball', category: 'outdoor' },
  { name: 'Volleyball', category: 'outdoor' },
  { name: 'Badminton', category: 'indoor' },
  { name: 'Table Tennis', category: 'indoor' },
];

await mongoose.connect(env.MONGODB_URI);
for (const s of SPORTS) {
  await Sport.updateOne({ name: s.name }, { $setOnInsert: s }, { upsert: true });
}
console.log(`Sports ready (${SPORTS.length})`);
await mongoose.disconnect();