import { REST, Routes } from "discord.js";

import { buildAllGuildApplicationCommandPayloads } from "@/commands/guild-command-payloads.js";

import type { AppEnv } from "@/config/env.js";

export async function syncGuildCommandsIfConfigured(env: AppEnv): Promise<void> {
  const applicationId = env.discordClientId;
  const guildId = env.discordGuildId;

  if (applicationId === undefined || guildId === undefined) {
    console.info(
      "guild command sync skipped (set DISCORD_CLIENT_ID and DISCORD_GUILD_ID to sync on startup)",
    );

    return;
  }

  const rest = new REST().setToken(env.discordToken);
  const body = buildAllGuildApplicationCommandPayloads();
  await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
    body,
  });
  console.info("guild slash commands synced at startup");
}
