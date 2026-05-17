import type { Client } from "discord.js";

import type { AppEnv } from "@/config/env.js";

import { listGlobalXpBoostsNeedingExpiryReply } from "@/repositories/team-xp.js";

import { sendXpBoostEndedReply } from "./xp-boost-ended-reply.js";

const TICK_MS = 60000;

export function startTeamXpBoostExpiryScheduler(client: Client, env: AppEnv): NodeJS.Timeout {
  const tick = (): void => {
    void runXpBoostExpiryTick(client, env).catch((err: unknown) => {
      console.error("team XP boost expiry tick failed:", err);
    });
  };

  tick();

  return setInterval(tick, TICK_MS);
}

async function runXpBoostExpiryTick(client: Client, env: AppEnv): Promise<void> {
  const guildId = env.discordGuildId;

  if (guildId === undefined || guildId === "") {
    return;
  }

  const now = new Date();
  const rows = await listGlobalXpBoostsNeedingExpiryReply({ guildId, now });

  for (const row of rows) {
    await sendXpBoostEndedReply(client, row, now);
  }
}
