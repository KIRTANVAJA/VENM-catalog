import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import homepageRoutes from './routes/homepageRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import { inquiryLimiter, analyticsLimiter } from './middleware/rateLimitMiddleware.js';
import { logActivity } from './utils/activityLogger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import prisma, { getActiveDbHost, isDatabaseConfigured } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://venm-store.vercel.app',
  'https://venm-catalog.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (typeof origin === 'string' && (origin.endsWith('.netlify.app') || origin.endsWith('.vercel.app')))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static uploads / public directory serving
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Health Check & Database Diagnostics
app.get('/api/health', async (req, res) => {
  const dbConfigured = isDatabaseConfigured();
  let dbStatus = 'NOT_CONFIGURED';
  let diagnostics = null;

  if (dbConfigured) {
    try {
      const rows = await prisma.$queryRaw`
        SELECT 
          current_database() AS db_name, 
          current_schema() AS schema_name,
          (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = current_schema()) AS table_count
      `;
      dbStatus = 'CONNECTED';

      diagnostics = {
        host: getActiveDbHost(),
        database: rows[0]?.db_name || null,
        schema: rows[0]?.schema_name || null,
        tableCount: Number(rows[0]?.table_count || 0)
      };
    } catch (e) {
      dbStatus = `ERROR: ${e.message}`;
    }
  }

  res.json({
    status: dbStatus === 'CONNECTED' ? 'OK' : 'DEGRADED',
    message: 'VENM API ONLINE',
    database: dbStatus,
    diagnostics,
    timestamp: new Date()
  });
});

// Analytics: WhatsApp Inquiry Button Click Event
app.post('/api/analytics/whatsapp-click', analyticsLimiter, async (req, res) => {
  const { productName, collectionName } = req.body;
  await logActivity({
    adminUserId: 'system-public',
    adminEmail: 'public-visitor',
    action: 'WHATSAPP_INQUIRY_CLICKED',
    entityType: 'ANALYTICS',
    entityName: productName || 'General Inquiry',
    description: `WhatsApp inquiry button clicked for "${productName || 'Catalog'}"`
  });
  res.json({ success: true });
});

// Analytics: Web Inquiry Form Submission Event
app.post('/api/analytics/inquiry-form', analyticsLimiter, async (req, res) => {
  const { productName, collectionName, clientName, clientContact, requestType, note } = req.body;
  await logActivity({
    adminUserId: 'system-public',
    adminEmail: clientContact || 'public-visitor',
    action: 'INQUIRY_FORM_SUBMITTED',
    entityType: 'INQUIRY',
    entityName: productName || 'Custom Look Request',
    description: `Look inquiry from ${clientName || 'Client'} (${clientContact}): ${requestType}. Note: ${note || 'None'}`
  });
  res.json({ success: true });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/activity', activityRoutes);
app.use('/api/analytics', analyticsLimiter, activityRoutes);
app.use('/api/inquiries', inquiryLimiter, inquiryRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
