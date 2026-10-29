// Dedicated Sliding-Window In-Memory Rate Limiter
// Each rate limiter created receives an isolated, independent storage map
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'TOO MANY REQUESTS. PLEASE TRY AGAIN LATER.'
} = {}) => {
  // CRITICAL: Isolated store per rate-limiter instance so limiters do NOT collide
  const limiterStore = new Map();

  return (req, res, next) => {
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    // Normalize IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
    const ip = rawIp.replace(/^::ffff:/, '');
    const now = Date.now();

    // Clean up expired entries periodically to prevent memory leaks
    if (limiterStore.size > 2000) {
      for (const [key, record] of limiterStore.entries()) {
        if (now - record.startTime > windowMs) {
          limiterStore.delete(key);
        }
      }
    }

    const record = limiterStore.get(ip);

    if (!record || now - record.startTime > windowMs) {
      limiterStore.set(ip, { startTime: now, count: 1 });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        message,
        retryAfterSeconds
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
  max: 300,
  message: 'TOO MANY EVENTS LOGGED. PLEASE SLOW DOWN.'
});

export const subscriberLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'TOO MANY SUBSCRIPTION ATTEMPTS. PLEASE TRY AGAIN LATER.'
});
