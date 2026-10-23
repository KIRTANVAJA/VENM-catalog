import db from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

// Connected SSE clients set
const sseClients = new Set();

// In-memory active visitors store: key = sessionId or IP, value = active visitor state
const activeVisitors = new Map();

// In-memory unique visitors registry (tracks unique visitor devices, sessions, and journeys across the site)
const uniqueVisitorRegistry = new Map();

function getOrInitVisitor(vid, sessKey, device, ip) {
  const visitorKey = vid || sessKey || ip || `vid_${Date.now()}`;
  let v = uniqueVisitorRegistry.get(visitorKey);
  if (!v) {
    const shortCode = visitorKey.replace(/^vid_/, '').slice(0, 6).toUpperCase();
    v = {
      id: visitorKey,
      shortId: shortCode,
      name: `Visitor #${shortCode}`,
      device: device || 'Desktop',
      ip: ip || 'Remote Client',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      totalSessions: 1,
      totalExplorations: 0,
      pathsExplored: [],
      currentPath: '/',
      inquiriesCount: 0
    };
    uniqueVisitorRegistry.set(visitorKey, v);
  }
  return v;
}

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
 * POST /api/analytics/heartbeat
 * Periodic heartbeat and page exploration tracker from active client tabs
 */
export const recordHeartbeat = async (req, res) => {
  try {
    const { visitorId, sessionId, user, currentPath, viewingProductId, pageTitle, device, referrer } = req.body;
    const now = Date.now();
    const vid = visitorId || sessionId || req.ip || `vid_${now}`;
    const sessKey = sessionId || vid;

    const v = getOrInitVisitor(vid, sessKey, device, req.ip);
    v.lastSeen = new Date().toISOString();
    v.currentPath = currentPath || '/';
    if (device) v.device = device;
    if (currentPath && !v.pathsExplored.includes(currentPath)) {
      v.pathsExplored.push(currentPath);
      v.totalExplorations = v.pathsExplored.length;
    }

    activeVisitors.set(sessKey, {
      id: sessKey,
      visitorId: vid,
      name: v.name,
      device: v.device,
      currentPath: currentPath || '/',
      pageTitle: pageTitle || currentPath || '/',
      pathsExplored: v.pathsExplored,
      totalExplored: v.pathsExplored.length,
      lastSeen: now,
      onlineSince: v.firstSeen
    });

    // Cleanup expired visitors (> 45 seconds)
    const cutoff = now - 45000;
    for (const [k, item] of activeVisitors.entries()) {
      if (item.lastSeen < cutoff) activeVisitors.delete(k);
    }

    // Log significant site explorations to ActivityLog in database
    if (currentPath && currentPath !== '/' && (!v.lastLoggedPath || v.lastLoggedPath !== currentPath)) {
      v.lastLoggedPath = currentPath;
      logActivity({
        adminUserId: vid,
        adminEmail: 'visitor@venm.exe',
        action: 'VISITOR_EXPLORATION',
        entityType: 'VISITOR',
        entityId: vid,
        entityName: currentPath,
        description: `${v.name} (${v.device}) explored "${currentPath}"`
      }).catch(() => {});
    }

    const liveList = Array.from(activeVisitors.values());
    res.json({
      success: true,
      liveOnlineCount: liveList.length,
      activeVisitors: liveList.slice(0, 20),
      uniqueVisitorsCount: uniqueVisitorRegistry.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/analytics/product-view
 * Record product view in real-time
 */
export const recordProductView = async (req, res) => {
  try {
    const { productId, productSlug, productName, visitorId, user } = req.body;
    
    // Increment viewCount on product in db
    if (productId || productSlug) {
      await db.product.updateMany({
        where: {
          OR: [
            ...(productId ? [{ id: productId }] : []),
            ...(productSlug ? [{ slug: productSlug }] : [])
          ]
        },
        data: {
          viewCount: { increment: 1 }
        }
      }).catch(() => {});
    }

    const vid = visitorId || user?.id || 'visitor';
    const shortCode = String(vid).replace(/^vid_/, '').slice(0, 6).toUpperCase();

    // Log in database
    await logActivity({
      adminUserId: vid,
      adminEmail: user?.email || user?.phone || 'visitor@venm.exe',
      action: 'PRODUCT_VIEW',
      entityType: 'PRODUCT',
      entityId: productId || productSlug,
      entityName: productName || 'Product Look',
      description: `Visitor #${shortCode} viewed "${productName || 'look'}"`
    }).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/activity/live-analytics
 * Complete user live activity analytics for the Admin Dashboard chart
 */
export const getLiveUserAnalytics = async (req, res) => {
  try {
    // 1. Live presence
    const cutoff = Date.now() - 45000;
    for (const [k, v] of activeVisitors.entries()) {
      if (v.lastSeen < cutoff) activeVisitors.delete(k);
    }
    const currentOnline = Array.from(activeVisitors.values());

    // 2. Database counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      allActivityLogs,
      todayInquiriesCount,
      totalInquiriesCount,
      allProducts
    ] = await Promise.all([
      db.activityLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24h
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.inquiry.count({ where: { createdAt: { gte: today } } }),
      db.inquiry.count(),
      db.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          category: true,
          collectionName: true,
          viewCount: true,
          estimatedPrice: true
        },
        orderBy: { viewCount: 'desc' },
        take: 8
      })
    ]);

    // Parse image for top products
    const mostVisitedProducts = allProducts.map((p) => {
      let img = null;
      try {
        const parsed = JSON.parse(p.images || '[]');
        img = parsed[0] || null;
      } catch (e) {}
      return {
        ...p,
        image: img || null
      };
    });

    // Compute unique visitors
    const todayVisitorsList = Array.from(uniqueVisitorRegistry.values()).filter(
      (v) => new Date(v.lastSeen) >= today
    );
    const uniqueVisitorsTodayCount = Math.max(todayVisitorsList.length, currentOnline.length);
    const uniqueVisitorsTotalCount = Math.max(uniqueVisitorRegistry.size, uniqueVisitorsTodayCount);

    const viewsToday = allActivityLogs.filter(
      (l) => (l.action === 'PRODUCT_VIEW' || l.action === 'VISITOR_EXPLORATION') && new Date(l.createdAt) >= today
    ).length;

    // Build timeline for chart (hourly slots for last 12 hours)
    const timelineSlots = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const slotStart = new Date(slotTime.getFullYear(), slotTime.getMonth(), slotTime.getDate(), slotTime.getHours(), 0, 0);
      const slotEnd = new Date(slotTime.getFullYear(), slotTime.getMonth(), slotTime.getDate(), slotTime.getHours() + 1, 0, 0);

      const slotLogs = allActivityLogs.filter((l) => {
        const t = new Date(l.createdAt);
        return t >= slotStart && t < slotEnd;
      });

      const uniqueInSlot = new Set(slotLogs.map(l => l.adminUserId).filter(Boolean)).size;

      timelineSlots.push({
        time: hourStr,
        visitors: Math.max(uniqueInSlot, slotLogs.filter(l => l.action === 'VISITOR_EXPLORATION').length),
        views: slotLogs.filter((l) => l.action === 'PRODUCT_VIEW' || l.action === 'VISITOR_EXPLORATION').length,
        inquiries: slotLogs.filter((l) => l.action === 'INQUIRY_CREATED' || l.action === 'INQUIRY_FORM_SUBMITTED').length
      });
    }

    res.json({
      liveOnline: {
        total: currentOnline.length,
        activeList: currentOnline
      },
      visitorMetrics: {
        uniqueVisitorsToday: uniqueVisitorsTodayCount,
        uniqueVisitorsTotal: uniqueVisitorsTotalCount,
        viewsToday: Math.max(viewsToday, currentOnline.reduce((acc, v) => acc + (v.totalExplored || 1), 0)),
        inquiriesToday: todayInquiriesCount,
        inquiriesTotal: totalInquiriesCount
      },
      mostVisitedProducts,
      activityTimeline: timelineSlots,
      recentUserEvents: allActivityLogs.slice(0, 30)
    });
  } catch (err) {
    console.error('[GET LIVE USER ANALYTICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/activity/visitors
 * Detailed unique visitor journeys and exploration history
 */
export const getUniqueVisitors = async (req, res) => {
  try {
    const visitors = Array.from(uniqueVisitorRegistry.values()).sort(
      (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
    );
    res.json({
      totalUniqueVisitors: visitors.length,
      visitors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const logs = await db.activityLog.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' }
    });
    const total = await db.activityLog.count({ where });

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
 * Returns 100% REAL data calculated from database
 */
export const getDashboardStats = async (req, res) => {
  try {
    const products = await db.product.findMany();
    const collections = await db.collection.findMany();
    const categories = await db.category.findMany();
    const campaigns = await db.campaign.findMany();
    const media = await db.media.findMany();
    const recentActivity = await db.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

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
