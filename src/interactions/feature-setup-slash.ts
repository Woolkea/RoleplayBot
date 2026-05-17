import {
  ChannelType,
  MessageFlags,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
} from "discord.js";

import { featureSetupCommandName } from "@/commands/feature-setup/definition.js";

import { getFeatureSetupHandler } from "@/features/feature-setup/registry.js";

export async function handleFeatureSetupSlash(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const featureId = interaction.options.getString("feature", true);
  const channel = interaction.options.getChannel("channel", true);
  const handler = getFeatureSetupHandler(featureId);

  if (handler === undefined) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Unbekanntes Feature — bitte erneut einreichen oder Bot aktualisieren.",
    });

    return;
  }

  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Dieser Befehl funktioniert nur in einer Guild.",
    });

    return;
  }

  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Bitte einen Guild-Textkanal wählen.",
    });

    return;
  }

  const guildChannel = channel as GuildTextBasedChannel;
  await handler.execute({ interaction, channel: guildChannel });
}

export function isFeatureSetupCommand(interaction: ChatInputCommandInteraction): boolean {
  return interaction.commandName === featureSetupCommandName;
}
