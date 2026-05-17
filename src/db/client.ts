import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import pg from "pg";

import { loadEnv } from "@/config/env.js";

import * as schema from "./schema.js";

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (pool === undefined) {
    const env = loadEnv();
    pool = new pg.Pool({
      connectionString: env.databaseUrl,
      max: 10,
    });
  }

  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  return drizzle(getPool(), { schema });
}

export async function closePool(): Promise<void> {
  if (pool === undefined) {
    return;
  }

  await pool.end();
  pool = undefined;
}

function isPostgresPasswordAuthFailure(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (
      error as {
        code?: string;
      }
    ).code === "28P01"
  );
}

export async function verifyDatabaseConnection(): Promise<void> {
  try {
    const p = getPool();
    await p.query("select 1");
  } catch (error: unknown) {
    if (isPostgresPasswordAuthFailure(error)) {
      throw new Error(
        [
          "PostgreSQL: Passwort oder Benutzer passt nicht (Fehler 28P01).",
          "Typisch lokal: Das Docker-Volume wurde früher mit einem anderen Passwort angelegt — Postgres übernimmt spätere Änderungen von POSTGRES_PASSWORD nicht.",
          "Einmalig lokale DB zurücksetzen (löscht lokale Daten): npm run db:reset-local",
          "Alternativ: Passwort in DATABASE_URL an das setzen, das die bestehende Datenbank erwartet.",
        ].join("\n"),
      );
    }

    throw error;
  }
}
