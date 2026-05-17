import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";

import { featureSetupHandlers } from "@/features/feature-setup/registry.js";

const commandName = "feature-setup";

export function buildFeatureSetupCommand() {
  const choices = featureSetupHandlers.map((h) => ({ name: h.name, value: h.id }));

  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Gemeinsames Setup für Server-Features (nur Administratoren).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("feature")
        .setDescription("Welches Feature konfiguriert werden soll.")
        .setRequired(true)
        .addChoices(...choices),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Textkanal für das Feature.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText),
    );
}

export function buildFeatureSetupCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildFeatureSetupCommand().toJSON();
}

export { commandName as featureSetupCommandName };
