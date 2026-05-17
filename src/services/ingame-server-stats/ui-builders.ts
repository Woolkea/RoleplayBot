import {
  ButtonBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";

import { ButtonStyle, escapeMarkdown, MessageFlags, type MessageMentionOptions } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import type { IngameServerStatsStateRow } from "@/repositories/ingame-server-stats.js";

import { INGAME_SERVER_STATS_MAX_PLAYERS } from "./constants.js";

function formatJoinCodeInline(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return "";
  }

  const inner = trimmed.replaceAll("`", "\u200b`");

  return `\`${inner}\``;
}

export function ingameServerStatsV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

function buildPanelBodyMarkdown(row: IngameServerStatsStateRow): string {
  const owner = escapeMarkdown(row.ownerDisplay);
  const countStr = String(row.playersCurrent);
  const maxStr = String(INGAME_SERVER_STATS_MAX_PLAYERS);
  const codeDisplay = formatJoinCodeInline(row.joinCode);

  return (
    `# LunarRP - Ingame-Server\n` +
    `> ${emojiToString(EMOJIS.INGAME_SERVER_OWNER)} **Owner:** ${owner}\n` +
    `> ${emojiToString(EMOJIS.INGAME_SERVER_SPIELER)} **Spieler:** ${countStr}/${maxStr}\n` +
    `> ${emojiToString(EMOJIS.INGAME_SERVER_CODE)} **Code:** ${codeDisplay}`
  );
}

function buildLastUpdatedLineMarkdown(row: IngameServerStatsStateRow): string {
  if (
    row.lastUpdatedAt !== null &&
    row.lastUpdatedByDiscordUserId !== null &&
    row.lastUpdatedByDiscordUserId !== ""
  ) {
    const unix = Math.floor(row.lastUpdatedAt.getTime() / 1000);

    return `-# Zuletzt aktualisiert <t:${String(unix)}:R> von <@${row.lastUpdatedByDiscordUserId}>`;
  }

  return "-# Zuletzt aktualisiert —";
}

function buildStatsAndFooterMarkdown(row: IngameServerStatsStateRow): string {
  return `${buildPanelBodyMarkdown(row)}\n\n${buildLastUpdatedLineMarkdown(row)}`;
}

export function ingameServerStatsPanelAllowedMentions(
  row: IngameServerStatsStateRow,
): MessageMentionOptions {
  const uid = row.lastUpdatedByDiscordUserId;

  return {
    parse: [],
    users: uid !== null && uid !== "" ? [uid] : [],
    roles: [],
    repliedUser: false,
  };
}

export function buildIngameServerStatsPanelContainer(args: {
  row: IngameServerStatsStateRow;
  thumbnailUrl?: string;
  bannerUrl: string;
}): ContainerBuilder {
  const fullBody = buildStatsAndFooterMarkdown(args.row);
  const thumb = args.thumbnailUrl?.trim();
  const banner = args.bannerUrl.trim();
  const container = new ContainerBuilder();

  if (thumb !== undefined && thumb.length > 0) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(fullBody))
        .setThumbnailAccessory((t) => t.setURL(thumb).setDescription("LunarRP")),
    );
  } else {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(fullBody));
  }

  if (banner.length > 0) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(banner)),
    );
  }

  return container;
}

export function buildIngameServerStatsSlashSuccessContainer(detail: string): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(detail),
  );
}

const SET_PLAYER_BROADCAST_SNIPPET = "broadcast @all 📡 Dizzy auf Lunar RP ist Pflicht -> /lunar";

export function buildSetPlayerBroadcastAckContainer(args: {
  buttonCustomId: string;
}): ContainerBuilder {
  const body = "```\n" + SET_PLAYER_BROADCAST_SNIPPET + "\n```";

  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(args.buttonCustomId)
          .setLabel("Abgesendet")
          .setStyle(ButtonStyle.Success),
      ),
    );
}

function buildWaitUntilMarkdown(waitUntil: Date): string {
  const unix = Math.floor(waitUntil.getTime() / 1000);

  return `<t:${String(unix)}:R>`;
}

export function buildSetPlayerCooldownBlockedContainer(args: {
  waitUntil: Date;
}): ContainerBuilder {
  const when = buildWaitUntilMarkdown(args.waitUntil);
  const content =
    `# ${emojiToString(EMOJIS.VERBOT)} Zu schnell\n\n` +
    `> Erst in ${when} erneut **/set-player** nutzen (15-Minuten-Abstand).`;

  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content),
  );
}

export function buildSetPlayerDiscordRateLimitContainer(args: {
  waitUntil: Date;
}): ContainerBuilder {
  const when = buildWaitUntilMarkdown(args.waitUntil);
  const content =
    `# ${emojiToString(EMOJIS.VERBOT)} Rate Limit\n\n` +
    `> Erst in ${when} erneut **Abgesendet** drücken oder **/set-player** wiederholen.`;

  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content),
  );
}
