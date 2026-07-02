import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

let connected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (connected) return mongoose;

  mongoose.connection.on("connected", () => {
    connected = true;
    logger.info(`mongo connected to "${env.mongo.dbName}"`);
  });
  mongoose.connection.on("disconnected", () => {
    connected = false;
    logger.warn("mongo disconnected");
  });
  mongoose.connection.on("error", (error) => {
    logger.error("mongo connection error", error);
  });

  await mongoose.connect(env.mongo.uri, {
    dbName: env.mongo.dbName,
    maxPoolSize: env.mongo.maxPoolSize,
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

export async function pingDatabase(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return false;
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}
