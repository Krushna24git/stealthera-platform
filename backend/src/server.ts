import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";
import { loadOpenApi } from "./docs/openapi.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  if (env.nodeEnv === "production" && env.auth.jwtSecret === "change-me-in-production") {
    logger.warn("JWT_SECRET is still the default value; set a strong secret before exposing this API");
  }

  loadOpenApi();
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`StealthEra RPM API listening on http://localhost:${env.port}`);
    logger.info(`API docs available at http://localhost:${env.port}/docs`);
    logger.info(`log level: ${env.logLevel} (set LOG_LEVEL=debug for verbose request/ingestion logs)`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`received ${signal}, draining connections`);

    // Stop accepting new connections, let in-flight requests finish, then close
    // the Mongo pool. If draining stalls, force-exit rather than hang the deploy.
    const forceExit = setTimeout(() => {
      logger.error("shutdown timed out, forcing exit");
      process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  logger.error("fatal startup error", error);
  process.exit(1);
});
