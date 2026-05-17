import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

import { INGAME_SERVER_STATS_MAX_PLAYERS } from "@/services/ingame-server-stats/constants.js";

const commandName = "set-player";

export function buildSetPlayerCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Team] Aktualisiert die Spieleranzahl im Ingame-Server-Stats-Panel.")
    .addIntegerOption((opt) =>
      opt
        .setName("count")
        .setDescription("Aktuelle Spielerzahl")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(INGAME_SERVER_STATS_MAX_PLAYERS),
    );
}

export function buildSetPlayerCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildSetPlayerCommand().toJSON();
}

export { commandName as setPlayerCommandName };
