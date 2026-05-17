import {
  ButtonBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";

import { ButtonStyle, escapeMarkdown, MessageFlags, SeparatorSpacingSize } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { buildOfficeRequestMoveButtonCustomId } from "@/interactions/custom-ids.js";

import { FEEDBACK_BANNER_URL } from "@/services/feedback/ui-builders.js";

import { formatWaitDurationDe } from "./format-wait-duration.js";

const DISCORD_BUTTON_LABEL_MAX = 80;

function truncateDiscordButtonLabel(text: string): string {
  if (text.length <= DISCORD_BUTTON_LABEL_MAX) {
    return text;
  }

  return `${text.slice(0, DISCORD_BUTTON_LABEL_MAX - 1)}…`;
}

export function officeRequestV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export function buildOfficeRequestOpenContainer(args: {
  requestId: number;
  requesterDiscordUserId: string;
  joinedAt: Date;
}): ContainerBuilder {
  const unix = Math.floor(args.joinedAt.getTime() / 1000);
  const body =
    `# ${emojiToString(EMOJIS.OFFICE)} Neue Büroanfrage\n\n` +
    `> **Nutzer:** <@${args.requesterDiscordUserId}>\n` +
    `> **Wartet seit:** <t:${String(unix)}:R>`;

  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(buildOfficeRequestMoveButtonCustomId(args.requestId))
          .setLabel("Rein moven")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.ERFOLGREICH_WHITE),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(FEEDBACK_BANNER_URL)),
    );
}

export function buildOfficeRequestClaimedContainer(args: {
  requestId: number;
  requesterDiscordUserId: string;
  joinedAt: Date;
  claimedAt: Date;
  claimerDisplayName: string;
}): ContainerBuilder {
  const waitLabel = formatWaitDurationDe(args.joinedAt, args.claimedAt);
  const body =
    `# ${emojiToString(EMOJIS.OFFICE)} Neue Büroanfrage\n\n` +
    `> **Nutzer:** <@${args.requesterDiscordUserId}>\n` +
    `> **Wartezeit:** ${escapeMarkdown(waitLabel)}`;
  const buttonLabel = truncateDiscordButtonLabel(`Gemovt von ${args.claimerDisplayName}`);

  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(buildOfficeRequestMoveButtonCustomId(args.requestId))
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.ERFOLGREICH_WHITE)
          .setDisabled(true),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(FEEDBACK_BANNER_URL)),
    );
}

export type OfficeRequestLogEditPayload = {
  flags: number;
  components: ContainerBuilder[];
};
