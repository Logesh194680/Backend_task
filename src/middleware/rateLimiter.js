const { getRedisClient, isRedisAvailable } = require('../utils/redisClient');

const memoryStore = new Map();

setInterval(() => {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
  
  for (const [key, value] of memoryStore.entries()) {
    if (now - value.windowStart > windowMs) {
      memoryStore.delete(key);
    }
  }
}, 60000);

const rateLimiter = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for rate limiting'
      });
    }

    const userId = req.user.id;
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;
    
    let requestCount = 0;
    let currentWindowStart = Date.now();
    
    const redisAvailable = isRedisAvailable();
    const redisClient = getRedisClient();
    
    if (redisAvailable && redisClient) {
      const key = `rate_limit:${userId}`;
      const currentData = await redisClient.get(key);
      
      if (currentData) {
        const data = JSON.parse(currentData);
        if (Date.now() - data.windowStart < windowMs) {
          requestCount = data.count;
          currentWindowStart = data.windowStart;
        }
      }
      
      requestCount++;
      
      await redisClient.set(
        key,
        JSON.stringify({
          count: requestCount,
          windowStart: currentWindowStart
        }),
        { EX: Math.ceil(windowMs / 1000) }
      );
    } else {
      const now = Date.now();
      const userData = memoryStore.get(userId);
      
      if (userData && (now - userData.windowStart) < windowMs) {
        requestCount = userData.count;
        currentWindowStart = userData.windowStart;
      } else {
        requestCount = 0;
        currentWindowStart = now;
      }
      
      requestCount++;
      
      memoryStore.set(userId, {
        count: requestCount,
        windowStart: currentWindowStart
      });
    }

    if (requestCount > maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs/1000} seconds.`,
        retryAfter: Math.ceil((currentWindowStart + windowMs - Date.now()) / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
    res.setHeader('X-RateLimit-Reset', new Date(currentWindowStart + windowMs).toISOString());
    
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
};

module.exports = rateLimiter;