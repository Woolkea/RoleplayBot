import type { Client } from "discord.js";

import { cleanupOldTeamXpHistory, snapshotTeamXp } from "@/repositories/team-xp.js";

const HISTORY_INTERVAL_MS = 15 * 60 * 1000;

export function startTeamXpHistoryScheduler(client: Client): void {
  setInterval(() => {
    void runHistoryJob(client);
  }, HISTORY_INTERVAL_MS);
  void runHistoryJob(client);
}

async function runHistoryJob(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    try {
      await snapshotTeamXp(guild.id);
      await cleanupOldTeamXpHistory(guild.id);
    } catch (err) {
      console.error(`Failed to run team XP history job for guild ${guild.id}:`, err);
    }
  }
}
