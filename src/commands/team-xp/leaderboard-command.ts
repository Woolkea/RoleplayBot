import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

const commandName = "team-leaderboard";

export function buildLeaderboardCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Zeigt das Team-Leaderboard (paginiert, nur für dich sichtbar).")
    .addIntegerOption((opt) =>
      opt.setName("page").setDescription("Seite (ab 1).").setMinValue(1).setRequired(false),
    );
}

export function buildLeaderboardCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildLeaderboardCommand().toJSON();
}

export { commandName as leaderboardCommandName };
