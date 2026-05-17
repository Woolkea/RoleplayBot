import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";

import type { Interaction } from "discord.js";

import { MessageFlags } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

const MAX_DETAIL = 3500;

function escapeCodeFenceBlock(detail: string): string {
  const trimmed = detail.trim();

  if (trimmed.length > MAX_DETAIL) {
    return `${trimmed.slice(0, MAX_DETAIL)}…`;
  }

  return trimmed.replaceAll("```", "``\u200b`");
}

export function buildUserFacingErrorContainer(detail: string): ContainerBuilder {
  const safe = escapeCodeFenceBlock(detail);
  const content = `# ${emojiToString(EMOJIS.VERBOT)} Fehler\n\n` + "```text\n" + safe + "\n```";

  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content),
  );
}

export async function replyUserFacingError(
  interaction: Interaction,
  detail: string,
): Promise<void> {
  if (!interaction.isRepliable()) {
    return;
  }

  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
  const components = [buildUserFacingErrorContainer(detail)];

  if (interaction.deferred && interaction.isModalSubmit()) {
    await interaction.deleteReply().catch(() => undefined);
    await interaction.followUp({ flags, components });

    return;
  }

  if (interaction.deferred) {
    await interaction.followUp({ flags, components });

    return;
  }

  if (interaction.replied) {
    await interaction.followUp({ flags, components });

    return;
  }

  await interaction.reply({ flags, components });
}
