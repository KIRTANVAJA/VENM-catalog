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
import { logActivity } from './utils/activityLogger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// Error Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
