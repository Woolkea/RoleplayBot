import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "xp-add";

export function buildXpAddCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Vergibt Team-XP an einen Nutzer.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName("user").setDescription("Zielnutzer").setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("XP-Basis (vor Boosts)")
        .setRequired(true)
        .setMinValue(1),
    );
}

export function buildXpAddCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildXpAddCommand().toJSON();
}

export { commandName as xpAddCommandName };
