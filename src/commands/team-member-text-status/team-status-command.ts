import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

const commandName = "team-status";

export function buildTeamStatusCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Status eines Mitglieds ansehen oder eintragen. Nur mit der passenden Rolle.")
    .addStringOption((opt) =>
      opt
        .setName("aktion")
        .setDescription("Ansehen oder eintragen wählen.")
        .setRequired(true)
        .addChoices({ name: "GET", value: "get" }, { name: "SET", value: "set" }),
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Mitglied, dessen Status du ansehen oder schreiben willst.")
        .setRequired(true),
    );
}

export function buildTeamStatusCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildTeamStatusCommand().toJSON();
}

export { commandName as teamStatusCommandName };
