import mongoose from 'mongoose';
import { cleanJson } from './plugins.js';

const groundSchema = new mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    pricePerHour: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'pricePerHour must be a whole number' },
    },
    openingTime: { type: String, required: true }, // "HH:00"
    closingTime: { type: String, required: true }, // "HH:00" or "24:00"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

groundSchema.index({ venue: 1, name: 1 }, { unique: true });

cleanJson(groundSchema);
export default mongoose.model('Ground', groundSchema);