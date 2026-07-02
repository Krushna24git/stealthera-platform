import dotenv from "dotenv";

dotenv.config();

function readString(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function readNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

function readList(key: string): string[] {
  return readString(key, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: readString("NODE_ENV", "development"),
  port: readNumber("PORT", 4000),

  mongo: {
    uri: readString("MONGODB_URI", "mongodb://127.0.0.1:27017"),
    dbName: readString("MONGODB_DB", "stealthera_rpm"),
    maxPoolSize: readNumber("MONGO_MAX_POOL_SIZE", 50),
  },

  auth: {
    enabled: readBool("AUTH_ENABLED", true),
    jwtSecret: readString("JWT_SECRET", "change-me-in-production"),
    jwtExpiresIn: readString("JWT_EXPIRES_IN", "12h"),
    deviceApiKeys: readList("DEVICE_API_KEYS"),
  },

  genetics: {
    baseUrl: readString("GENETICS_API_BASE_URL", "http://127.0.0.1:4000/api/v1").replace(/\/$/, ""),
    timeoutMs: readNumber("GENETICS_API_TIMEOUT_MS", 4000),
    cacheTtlMs: readNumber("GENETICS_CACHE_TTL_MS", 300000),
  },

  cors: {
    origins: readString("CORS_ORIGINS", "*"),
  },

  thresholds: {
    heartRateHigh: readNumber("HR_HIGH_BPM", 120),
    heartRateLow: readNumber("HR_LOW_BPM", 45),
    spo2Low: readNumber("SPO2_LOW_PERCENT", 92),
    temperatureHigh: readNumber("TEMP_HIGH_C", 38),
    temperatureLow: readNumber("TEMP_LOW_C", 35),
    inactivityStepsMin: readNumber("INACTIVITY_STEPS_MIN", 100),
  },

  limits: {
    defaultPageSize: readNumber("DEFAULT_PAGE_SIZE", 50),
    maxPageSize: readNumber("MAX_PAGE_SIZE", 500),
    defaultHistoryLimit: readNumber("DEFAULT_HISTORY_LIMIT", 200),
    maxHistoryLimit: readNumber("MAX_HISTORY_LIMIT", 2000),
  },

  seed: {
    adminEmail: readString("SEED_ADMIN_EMAIL", "admin@stealthera.health"),
    adminPassword: readString("SEED_ADMIN_PASSWORD", "StealthEra#2026"),
  },
};

export type Env = typeof env;
