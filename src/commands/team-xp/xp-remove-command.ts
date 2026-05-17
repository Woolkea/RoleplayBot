import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "xp-remove";

export function buildXpRemoveCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Entfernt Team-XP von einem Nutzer.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName("user").setDescription("Zielnutzer").setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Abzuziehende XP").setRequired(true).setMinValue(1),
    );
}

export function buildXpRemoveCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildXpRemoveCommand().toJSON();
}

export { commandName as xpRemoveCommandName };
