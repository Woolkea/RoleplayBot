import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

const commandName = "dizzykontrolle";

export function buildDizzykontrolleCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Dizzy-Kontrolle per Roblox-Benutzername prüfen und Moderator-XP verbuchen.")
    .addStringOption((opt) =>
      opt
        .setName("roblox_username")
        .setDescription("Roblox-Benutzername des Spielers")
        .setRequired(true),
    );
}

export function buildDizzykontrolleCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildDizzykontrolleCommand().toJSON();
}

export { commandName as dizzykontrolleCommandName };
