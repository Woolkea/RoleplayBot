import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "set-code";

export function buildSetCodeCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(
      "[Admin] Setzt den Join-Code im Ingame-Server-Stats-Panel (leer lassen zum Entfernen).",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName("code")
        .setDescription("Join-Code (optional weglassen zum Leeren)")
        .setRequired(false)
        .setMaxLength(100),
    );
}

export function buildSetCodeCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildSetCodeCommand().toJSON();
}

export { commandName as setCodeCommandName };
