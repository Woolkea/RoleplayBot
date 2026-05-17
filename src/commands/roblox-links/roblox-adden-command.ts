import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

const commandName = "roblox-adden";

export function buildRobloxAddenCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Verknüpft deinen Discord-Account mit einem Roblox-Account (nur Team).")
    .addStringOption((opt) =>
      opt
        .setName("benutzername")
        .setDescription("Roblox-Benutzername")
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(64),
    );
}

export function buildRobloxAddenCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildRobloxAddenCommand().toJSON();
}

export { commandName as robloxAddenCommandName };
