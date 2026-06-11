// src/utils/redisClient.js
const redis = require('redis');

let redisClient = null;
let redisAvailable = false;

const initializeRedis = async () => {
  
  if (process.env.SKIP_REDIS === 'true') {
    console.log('⚠️ Redis skipped (SKIP_REDIS=true)');
    return null;
  }

  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 3000 
      },
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return false;
        }
        if (options.total_retry_time > 1000 * 3) {
          return false;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      if (redisAvailable) {
        console.warn('Redis connection lost:', err.message);
        redisAvailable = false;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️ Redis not available, using in-memory fallback');
        }
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
      redisAvailable = true;
    });

    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 3000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    return redisClient;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Redis not available (optional), using in-memory rate limiting');
    }
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

const isRedisAvailable = () => redisAvailable;

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisAvailable
};