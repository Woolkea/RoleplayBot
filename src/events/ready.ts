import { ActivityType, Events, type Client } from "discord.js";

import { syncGuildCommandsIfConfigured } from "@/commands/sync-guild-commands.js";

import type { AppEnv } from "@/config/env.js";

import { ensureDizzyStickyOnReady } from "@/services/team-xp/dizzy-roblox-flow.service.js";

import { startTeamXpHistoryScheduler } from "@/services/team-xp/history-scheduler.js";

import { startTeamXpBoostExpiryScheduler } from "@/services/team-xp/xp-boost-expiry-scheduler.js";

import { startTeamXpVoiceScheduler } from "@/services/team-xp/voice-xp-scheduler.js";

import { PUBLIC_SITE_URL } from "@/types/presence.js";

export function registerReadyHandler(client: Client, env: AppEnv): void {
  client.once(Events.ClientReady, (readyClient) => {
    void handleClientReady(readyClient, env);
  });
}

async function handleClientReady(readyClient: Client<true>, env: AppEnv): Promise<void> {
  readyClient.user.setPresence({
    status: "online",
    activities: [
      {
        type: ActivityType.Custom,
        name: "Custom Status",
        state: PUBLIC_SITE_URL,
      },
    ],
  });

  try {
    await syncGuildCommandsIfConfigured(env);
  } catch (error: unknown) {
    console.error("guild command sync failed:", error);
  }

  startTeamXpVoiceScheduler(readyClient, env);
  startTeamXpHistoryScheduler(readyClient);
  startTeamXpBoostExpiryScheduler(readyClient, env);
  await ensureDizzyStickyOnReady(readyClient);
  console.info(`ready as ${readyClient.user.tag}`);
}
