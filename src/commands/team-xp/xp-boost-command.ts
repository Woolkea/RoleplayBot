import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "xp-boost";

export function buildXpBoostCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Setzt einen globalen XP-Boost (Multiplikator, zeitlich begrenzt).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addNumberOption((opt) =>
      opt
        .setName("percent")
        .setDescription("Prozent Aufschlag (z. B. 20 für +20 %)")
        .setRequired(true)
        .setMinValue(0),
    )
    .addIntegerOption((opt) =>
      opt.setName("hours").setDescription("Laufzeit in Stunden").setRequired(true).setMinValue(1),
    )
    .addStringOption((opt) =>
      opt
        .setName("grund")
        .setDescription("Grund für den Boost")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(300),
    );
}

export function buildXpBoostCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildXpBoostCommand().toJSON();
}

export { commandName as xpBoostCommandName };
