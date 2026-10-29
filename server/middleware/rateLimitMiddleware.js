// Lightweight In-Memory Rate Limiter for Inquiries & Analytics
const rateLimitMap = new Map();

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'TOO MANY REQUESTS. PLEASE TRY AGAIN LATER.'
} = {}) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries periodically to prevent memory leaks
    if (rateLimitMap.size > 5000) {
      for (const [key, record] of rateLimitMap.entries()) {
        if (now - record.startTime > windowMs) {
          rateLimitMap.delete(key);
        }
      }
    }

    const record = rateLimitMap.get(ip);

    if (!record || now - record.startTime > windowMs) {
      rateLimitMap.set(ip, { startTime: now, count: 1 });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        message,
        retryAfterSeconds: Math.ceil((record.startTime + windowMs - now) / 1000)
      });
    }

    record.count += 1;
    next();
  };
};

export const inquiryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'TOO MANY INQUIRY SUBMISSIONS. PLEASE WAIT A MOMENT BEFORE TRYING AGAIN.'
});

export const analyticsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'TOO MANY EVENTS LOGGED. PLEASE SLOW DOWN.'
});

export const subscriberLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'TOO MANY SUBSCRIPTION ATTEMPTS. PLEASE TRY AGAIN LATER.'
});
