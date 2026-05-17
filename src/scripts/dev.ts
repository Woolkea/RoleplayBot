import { spawn, spawnSync } from "node:child_process";

import { existsSync } from "node:fs";

import path from "node:path";

import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

function dockerDaemonReachable(): boolean {
  const r = spawnSync("docker", ["info"], { stdio: "ignore" });

  return r.status === 0;
}

function main(): void {
  if (!dockerDaemonReachable()) {
    console.error(
      "Docker-API nicht erreichbar (läuft Docker Desktop bzw. der Docker-Daemon?).\n" +
        "  Lokale Postgres: Docker starten, danach erneut `npm run dev`.\n" +
        "  Bereits erreichbare DB (z. B. gehostet): `npm run dev:app`.\n" +
        "  Nur Container hochfahren: `npm run db:up`.",
    );
    process.exit(1);
  }

  const compose = spawnSync("docker", ["compose", "up", "-d", "postgres", "--wait"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (compose.error) {
    console.error(compose.error);
    process.exit(1);
  }

  if (compose.status !== 0) {
    process.exit(compose.status ?? 1);
  }

  if (!existsSync(tsxCli)) {
    console.error("tsx CLI nicht gefunden (node_modules/tsx). Bitte `npm install` ausführen.");
    process.exit(1);
  }

  const child = spawn(process.execPath, [tsxCli, "watch", "src/index.ts"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(1);
    }

    process.exit(code ?? 0);
  });
}

main();
