import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "teamliste-edit";

export function buildTeamlisteEditCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Teamliste-Kategorien verwalten (nur Administratoren).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
}

export function buildTeamlisteEditCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildTeamlisteEditCommand().toJSON();
}

export { commandName as teamlisteEditCommandName };
