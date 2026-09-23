import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import { initializeDatabase } from './bootstrap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');

dotenv.config({
  path: path.join(serverDir, '.env')
});

const app = express();

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '0.0.0.0';

app.set('trust proxy', 1);

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const normalized = origin.replace(/\/+$/, '');

  if (configuredOrigins.includes(normalized)) {
    return true;
  }

  try {
    const url = new URL(normalized);

    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith('.onrender.com') &&
      url.hostname.startsWith('asy-global-portal')
    );
  } catch {
    return false;
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: '1mb'
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ASY Global Travel & Mobility Portal'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/testimonials', testimonialRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Unexpected server error.'
  });
});

try {
  await initializeDatabase();

  app.listen(port, host, () => {
    console.log(
      `ASY Portal API running on http://${host}:${port}`
    );
  });
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}