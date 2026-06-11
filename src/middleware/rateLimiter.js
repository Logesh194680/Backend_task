const memoryStore = new Map();

const rateLimiter = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for rate limiting",
      });
    }

    const userId = req.user.id;
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;

    const now = Date.now();
    const userData = memoryStore.get(userId);
    let requestCount = 0;
    let currentWindowStart = now;

    if (userData && now - userData.windowStart < windowMs) {
      requestCount = userData.count;
      currentWindowStart = userData.windowStart;
    } else {
      requestCount = 0;
      currentWindowStart = now;
    }

    requestCount++;

    memoryStore.set(userId, {
      count: requestCount,
      windowStart: currentWindowStart,
    });

    setTimeout(() => {
      for (const [key, value] of memoryStore.entries()) {
        if (Date.now() - value.windowStart > windowMs) {
          memoryStore.delete(key);
        }
      }
    }, windowMs);

    if (requestCount > maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil(
          (currentWindowStart + windowMs - Date.now()) / 1000,
        ),
      });
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - requestCount),
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(currentWindowStart + windowMs).toISOString(),
    );

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next();
  }
};

module.exports = rateLimiter;
