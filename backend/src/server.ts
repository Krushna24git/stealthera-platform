import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";
import { loadOpenApi } from "./docs/openapi.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  loadOpenApi();
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`StealthEra RPM API listening on http://localhost:${env.port}`);
    logger.info(`API docs available at http://localhost:${env.port}/docs`);
    logger.info(`log level: ${env.logLevel} (set LOG_LEVEL=debug for verbose request/ingestion logs)`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`received ${signal}, shutting down`);
    server.close(() => undefined);
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  logger.error("fatal startup error", error);
  process.exit(1);
});
