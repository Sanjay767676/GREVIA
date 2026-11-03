import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './lib/errors.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import adminRoutes from './routes/admin.js';
import directoryRoutes from './routes/directory.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import cronRoutes from './routes/cron.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'grievia-api', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', directoryRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/cron', cronRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
