import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

import { INGAME_SERVER_STATS_OWNER_MAX_LENGTH } from "@/services/ingame-server-stats/constants.js";

const commandName = "set-owner";

export function buildSetOwnerCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Team] Setzt die Owner-Zeile im Ingame-Server-Stats-Panel.")
    .addStringOption((opt) =>
      opt
        .setName("text")
        .setDescription("Anzeigetext (z. B. Namen)")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(INGAME_SERVER_STATS_OWNER_MAX_LENGTH),
    );
}

export function buildSetOwnerCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildSetOwnerCommand().toJSON();
}

export { commandName as setOwnerCommandName };
