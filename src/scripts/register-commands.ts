import "dotenv/config";

import { REST, Routes } from "discord.js";

import { buildAllGuildApplicationCommandPayloads } from "@/commands/guild-command-payloads.js";

import { loadCommandRegistrationEnv } from "@/config/env.js";

async function main(): Promise<void> {
  const env = loadCommandRegistrationEnv();
  const rest = new REST().setToken(env.discordToken);
  const body = buildAllGuildApplicationCommandPayloads();
  await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId), {
    body,
  });
  console.info("guild slash commands registered");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
