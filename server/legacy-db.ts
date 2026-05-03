import { Pool } from "@neondatabase/serverless";

let legacyPool: Pool | null = null;
let legacyPoolInitFailed = false;

export function getLegacyPool(): Pool | null {
  if (legacyPoolInitFailed) return null;
  if (legacyPool) return legacyPool;

  const url = process.env.LEGACY_DATABASE_URL;
  if (!url) return null;

  try {
    legacyPool = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 5000,
    });
    legacyPool.on("error", (err: Error) => {
      console.error("🟠 Legacy DB pool error (non-fatal):", err.message);
    });
    return legacyPool;
  } catch (err) {
    console.error("🟠 Failed to initialize legacy DB pool:", err);
    legacyPoolInitFailed = true;
    return null;
  }
}

export function isLegacyDbConfigured(): boolean {
  return Boolean(process.env.LEGACY_DATABASE_URL);
}
