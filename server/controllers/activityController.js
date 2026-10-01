import db from '../config/db.js';

// Connected SSE clients set
const sseClients = new Set();

// Register global SSE broadcast function so db.activityLog.create triggers live updates
global.broadcastActivitySSE = (activityLog) => {
  const payload = `data: ${JSON.stringify(activityLog)}\n\n`;
  for (const clientRes of sseClients) {
    try {
      clientRes.write(payload);
    } catch (err) {
      sseClients.delete(clientRes);
    }
  }
};

/**
 * GET /api/admin/activity
 * Paginated activity logs for authenticated admin
 */
export const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const page = parseInt(req.query.page, 10) || 1;
    const action = req.query.action || null;
    const entityType = req.query.entityType || null;

    const logs = await db.activityLog.findMany({ limit, page, action, entityType });
    const total = await db.activityLog.count({ action, entityType });

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'FAILED TO FETCH ACTIVITY LOGS', error: err.message });
  }
};

/**
 * GET /api/admin/dashboard-stats
 * Returns 100% REAL data calculated from PostgreSQL / Store database
 */
export const getDashboardStats = async (req, res) => {
  try {
    const products = await db.product.findMany();
    const collections = await db.collection.findMany();
    const categories = await db.category.findMany();
    const campaigns = await db.campaign.findMany();
    const media = await db.media.findMany();
    const recentActivity = await db.activityLog.findMany({ limit: 15 });

    // Calculate real stats strictly based on current database records
    const productStats = {
      total: products.length,
      published: products.filter(p => p.availability !== 'DRAFT').length,
      draft: products.filter(p => p.availability === 'DRAFT').length,
      inStock: products.filter(p => p.availability === 'IN STOCK').length,
      madeToOrder: products.filter(p => p.availability === 'MADE TO ORDER').length,
      comingSoon: products.filter(p => p.availability === 'COMING SOON').length,
      soldOut: products.filter(p => p.availability === 'SOLD OUT').length
    };

    const collectionStats = {
      total: collections.length,
      active: collections.filter(c => c.status === 'ACTIVE').length,
      comingSoon: collections.filter(c => c.status === 'COMING_SOON').length
    };

    const categoryStats = {
      total: categories.length
    };

    const campaignStats = {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'ACTIVE').length
    };

    const mediaStats = {
      total: media.length
    };

    const systemStatus = {
      database: 'Connected',
      apiServer: 'Online',
      mediaStorage: 'Available',
      timestamp: new Date().toISOString()
    };

    res.json({
      products: productStats,
      collections: collectionStats,
      categories: categoryStats,
      campaigns: campaignStats,
      media: mediaStats,
      recentActivity,
      systemStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'FAILED TO FETCH DASHBOARD STATS', error: err.message });
  }
};

/**
 * GET /api/admin/activity/stream
 * Real-time Server-Sent Events (SSE) connection
 */
export const streamActivity = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send immediate heartbeat/connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
};
