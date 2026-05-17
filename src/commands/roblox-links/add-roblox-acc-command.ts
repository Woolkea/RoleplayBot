import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "add-roblox-acc";

export function buildAddRobloxAccCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Verknüpft einen Teammitglied-Discord-Account mit Roblox.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Teammitglied (Discord)").setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("benutzername")
        .setDescription("Roblox-Benutzername")
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(64),
    );
}

export function buildAddRobloxAccCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildAddRobloxAccCommand().toJSON();
}

export { commandName as addRobloxAccCommandName };
