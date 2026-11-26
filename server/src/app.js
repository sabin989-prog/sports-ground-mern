import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import path from 'node:path';                       // with the imports
import sportsRoutes from './routes/sports.js';
import venueRoutes from './routes/venues.js';
import ownerRoutes from './routes/owner.js';


const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/owner', ownerRoutes);

if (env.NODE_ENV !== 'production') {
  app.use('/media', express.static(path.resolve(env.MEDIA_ROOT)));
}
app.use(notFound);
app.use(errorHandler);

export default app;