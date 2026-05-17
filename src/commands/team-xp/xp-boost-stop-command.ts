import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "xp-boost-stop";

export function buildXpBoostStopCommand(): SlashCommandBuilder {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Beendet alle aktiven globalen XP-Boosts in dieser Guild sofort.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
}

export function buildXpBoostStopCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildXpBoostStopCommand().toJSON();
}

export { commandName as xpBoostStopCommandName };
