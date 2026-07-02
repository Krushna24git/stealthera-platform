import express, { type Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { getRoot } from "./controllers/system.controller.js";
import { getOpenApiDocument, serveOpenApiYaml } from "./docs/openapi.js";
import apiRouter from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  const origins = env.cors.origins.trim();
  app.use(cors(origins === "*" ? {} : { origin: origins.split(",").map((o) => o.trim()) }));
  app.use(express.json({ limit: "256kb" }));
  app.use(requestLogger);

  app.get("/", getRoot);
  app.get("/openapi.yaml", serveOpenApiYaml);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(getOpenApiDocument()));

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
