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
import { logActivity } from './utils/activityLogger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VENM API ONLINE', timestamp: new Date() });
});

// Analytics: WhatsApp Inquiry Button Click Event
app.post('/api/analytics/whatsapp-click', async (req, res) => {
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
app.post('/api/analytics/inquiry-form', async (req, res) => {
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
app.use('/api/analytics', activityRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
