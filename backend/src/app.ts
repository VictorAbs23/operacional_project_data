import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from './config/passport.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import syncRoutes from './modules/sync/sync.routes.js';
import formsRoutes from './modules/forms/forms.routes.js';
import capturesRoutes from './modules/captures/captures.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import proposalsRoutes from './modules/proposals/proposals.routes.js';
import exportsRoutes from './modules/exports/exports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import clientsRoutes from './modules/clients/clients.routes.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// Passport
app.use(passport.initialize());

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/captures', capturesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/clients', clientsRoutes);

// Error handler
app.use(errorHandler);

export default app;
