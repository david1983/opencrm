import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import passport from 'passport';

// Import routes
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import setupRoutes from './routes/setupRoutes.js';
import userAdminRoutes from './routes/userAdminRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import roleAdminRoutes from './routes/roleAdminRoutes.js';
// Import middleware
import errorHandler from './middleware/error.js';

// Import passport config
import './config/passport.js';

const app = express();

// Body parser
app.use(express.json({ limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Passport middleware
app.use(passport.initialize());

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin/organization', adminRoutes);
app.use('/api/admin/setup', setupRoutes);
app.use('/api/admin/users', userAdminRoutes);
app.use('/api/admin/roles', roleAdminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/attachments', attachmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

export default app;