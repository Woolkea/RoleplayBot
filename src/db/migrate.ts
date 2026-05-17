import "dotenv/config";

import path from "node:path";

import process from "node:process";

import { drizzle } from "drizzle-orm/node-postgres";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import pg from "pg";

import { loadEnv } from "@/config/env.js";

async function main(): Promise<void> {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  const env = loadEnv();
  const pool = new pg.Pool({ connectionString: env.databaseUrl });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder });
  await pool.end();
  console.info("database migrations applied");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
