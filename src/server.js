const app = require("./app");
const { PrismaClient } = require("@prisma/client");
// const { initializeRedis } = require('./utils/redisClient'); // Comment this out

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log(" Database connected successfully");

    // Redis is optional - comment out
    // await initializeRedis();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(` API URL: http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log("Received shutdown signal, closing connections...");

      server.close(async () => {
        console.log("HTTP server closed");

        try {
          await prisma.$disconnect();
          console.log("Database connection closed");

          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
