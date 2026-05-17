import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const commandName = "remove-roblox-acc";

export function buildRemoveRobloxAccCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("[Admin] Entfernt die Roblox-Verknüpfung eines Nutzers.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName("user").setDescription("Discord-Nutzer").setRequired(true));
}

export function buildRemoveRobloxAccCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildRemoveRobloxAccCommand().toJSON();
}

export { commandName as removeRobloxAccCommandName };
