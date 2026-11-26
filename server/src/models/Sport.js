import mongoose from 'mongoose';
import { cleanJson } from './plugins.js';

const sportSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
  category: { type: String, enum: ['indoor', 'outdoor'], required: true },
});

cleanJson(sportSchema);
export default mongoose.model('Sport', sportSchema);