import db from '../config/db.js';

/**
 * Log a real backend operation into the activityLog database table and broadcast to live SSE subscribers.
 */
export async function logActivity({
  adminUserId = 'admin-1',
  adminEmail = 'venm1310@gmail.com',
  action,
  entityType,
  entityId = null,
  entityName = '',
  description = '',
  metadata = {}
}) {
  try {
    const entry = await db.activityLog.create({
      data: {
        adminUserId,
        adminEmail,
        action,
        entityType,
        entityId,
        entityName,
        description,
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {})
      }
    });
    if (global.broadcastActivitySSE) {
      global.broadcastActivitySSE(entry);
    }
    return entry;
  } catch (err) {
    console.warn('[ACTIVITY LOGGER] Failed to log activity:', err.message);
    return null;
  }
}
