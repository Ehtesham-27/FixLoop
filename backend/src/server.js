import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env, validateEnv } from './config/env.js';

// Validate environment variables on startup
validateEnv();

let server;

async function startServer() {
  try {
    // Attempt database connection
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      console.log(`[FixLoop API] Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[FixLoop API] Health check available at: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[FixLoop API] Fatal error during startup: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n[FixLoop API] Received ${signal}. Closing HTTP server and database connection...`);
  if (server) {
    server.close(async () => {
      console.log('[FixLoop API] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();

