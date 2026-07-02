import morgan from "morgan";
import { env } from "../config/env.js";

export const requestLogger = morgan(env.nodeEnv === "production" ? "combined" : "dev", {
  skip: (req) => (req.url ?? "").endsWith("/health"),
});
