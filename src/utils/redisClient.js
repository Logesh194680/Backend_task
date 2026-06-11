const redis = require("redis");

let redisClient = null;

const initializeRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis Client Connected");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    console.log("Using in-memory rate limiting fallback");
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = {
  initializeRedis,
  getRedisClient,
};
