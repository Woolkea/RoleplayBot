import { spawnSync } from "node:child_process";

import { existsSync } from "node:fs";

import path from "node:path";

import process from "node:process";

import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

function dockerDaemonReachable(): boolean {
  const r = spawnSync("docker", ["info"], { stdio: "ignore" });

  return r.status === 0;
}

function runDockerCompose(args: string[]): void {
  const r = spawnSync("docker", ["compose", ...args], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }

  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function main(): void {
  if (!dockerDaemonReachable()) {
    console.error(
      "Docker nicht erreichbar. Docker Desktop starten, dann erneut `npm run db:reset-local`.",
    );
    process.exit(1);
  }

  console.info("Postgres-Volume entfernen und Container neu anlegen …");
  runDockerCompose(["down", "-v"]);
  runDockerCompose(["up", "-d", "postgres", "--wait"]);

  if (!existsSync(tsxCli)) {
    console.error("tsx fehlt — zuerst `npm install`.");
    process.exit(1);
  }

  console.info("Migrationen anwenden …");
  const migrate = spawnSync(process.execPath, [tsxCli, "src/db/migrate.ts"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (migrate.status !== 0) {
    process.exit(migrate.status ?? 1);
  }

  console.info("Fertig. `DATABASE_URL` und POSTGRES_* in `.env` müssen übereinstimmen.");
}

main();
