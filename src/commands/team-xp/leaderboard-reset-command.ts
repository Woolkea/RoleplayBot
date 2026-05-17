import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "leaderboard-reset";

export function buildLeaderboardResetCommand(): SlashCommandBuilder {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Setzt das gesamte Team-Leaderboard zurück.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
}

export function buildLeaderboardResetCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildLeaderboardResetCommand().toJSON();
}

export { commandName as leaderboardResetCommandName };
