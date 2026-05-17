import {
  ButtonBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";

import { ButtonStyle, MessageFlags, SeparatorSpacingSize } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import {
  buildTeamXpLeaderboardButtonCustomId,
  buildTeamXpLeaderboardNextButtonCustomId,
  buildTeamXpLeaderboardPrevButtonCustomId,
  teamTxtStatusBtnMine,
  teamXpBtnStatus,
} from "@/interactions/custom-ids.js";

export const TEAM_XP_PANEL_BANNER_URL =
  "https://media.discordapp.net/attachments/1500208165307027587/1500837090668052640/LunarRP.png?ex=69fb3476&is=69f9e2f6&hm=dcaf2ed48037580b5127d01f270d96230866fe2f2cf9af0b46a56122cb077a55&=&format=webp&quality=lossless&width=1872&height=52";
const TEAM_LEADERBOARD_TITLE = `# ${emojiToString(EMOJIS.LEADERBOARD_TEAM_XP)} Team-Leaderboard`;

export function teamXpV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export function buildDizzyControlLogContainer(args: {
  moderatorUserId: string;
  targetUserId: string;
}): ContainerBuilder {
  const body =
    `# ${emojiToString(EMOJIS.BERECHTIGT)} Dizzy-Kontrolle durchgeführt\n` +
    `> **Teammitglied:** <@${args.moderatorUserId}>\n` +
    `> **Spieler:** <@${args.targetUserId}>`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}

export function buildDizzyControlLogErrorContainer(args: {
  moderatorUserId: string;
  targetUserId: string;
  fehlerText: string;
}): ContainerBuilder {
  const body =
    `# ${emojiToString(EMOJIS.KICK)} Dizzy-Kontrolle Fehler\n` +
    `> **Teammitglied:** <@${args.moderatorUserId}>\n` +
    `> **Spieler:** <@${args.targetUserId}>\n` +
    `> **Fehler:** ${args.fehlerText}`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}

export function buildTeamXpPanelContainer(): ContainerBuilder {
  const branch = emojiToString(EMOJIS.LINE_LANG);
  const branchTop = emojiToString(EMOJIS.LINIE_LANG_OBEN);
  const feedbackBranch = emojiToString(EMOJIS.LINE);
  const xpVerteilung = [
    "### XP-Verteilung...",
    "",
    `${branchTop} ${emojiToString(EMOJIS.NACHRICHT)} **Nachrichten:** 5 XP pro Nachricht (60 Sekunden Cooldown).`,
    `${branch} ${emojiToString(EMOJIS.VOICE)} **Voice:** Pro Minute in den Supporträumen oder Büros 1 XP (nicht Pause).`,
    `${branch} ${emojiToString(EMOJIS.KONTROLLE)} **Dizzy-Kontrolle:** 15 XP für jede Kontrolle mit /dizzykontrolle.`,
    `${branch} ${emojiToString(EMOJIS.TEAM_XP_PANEL_STATS)} **Ingame-Stats:** Bei /set-player bis zu +100 Team-XP (15-Minuten-Cooldown).`,
    `${branch} ${emojiToString(EMOJIS.ADMIN_CALL)} **Admin Call:** 15 XP pro angenommenem Admin-Call.`,
    `${feedbackBranch} ${emojiToString(EMOJIS.STERN)} **Feedback:** Bei 5 Sternen 10 XP und bei 4 Sternen 8 XP.`,
  ].join("\n");

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(TEAM_LEADERBOARD_TITLE),
      new TextDisplayBuilder().setContent(xpVerteilung),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(teamXpBtnStatus)
          .setLabel("Meine Stats")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.STATS_WHITE),
        new ButtonBuilder()
          .setCustomId(buildTeamXpLeaderboardButtonCustomId(1))
          .setLabel("Team-Leaderboard")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.LEADERBOARD_WHITE),
        new ButtonBuilder()
          .setCustomId(teamTxtStatusBtnMine)
          .setLabel("Meinen Status")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.COMMENT_WHITE),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(TEAM_XP_PANEL_BANNER_URL),
      ),
    );
}

export function buildTeamXpStatusContainer(args: {
  xp: number;
  averageXp?: number;
}): ContainerBuilder {
  const avgLine =
    args.averageXp !== undefined ? `\n> **Team-Durchschnitt:** ${String(args.averageXp)} XP` : "";

  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${TEAM_LEADERBOARD_TITLE}\n\n> **Deine XP:** ${String(args.xp)}${avgLine}`,
    ),
  );
}

export function buildTeamXpLeaderboardContainer(args: {
  page: number;
  totalPages: number;
  total: number;
  entries: Array<{
    rank: number;
    userId: string;
    xp: number;
    avatarUrl: string | null;
  }>;
  includePagination?: boolean;
}): ContainerBuilder {
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(TEAM_LEADERBOARD_TITLE),
  );

  if (args.entries.length > 0) {
    for (let i = 0; i < args.entries.length; i++) {
      const e = args.entries[i];
      const body = `## ${String(e.rank)}. <@${e.userId}>: ${String(e.xp)} XP`;
      container.addSectionComponents((section) => {
        section.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
        const url = e.avatarUrl;

        if (url !== null && url.length > 0) {
          section.setThumbnailAccessory((thumb) => thumb.setURL(url));
        }

        return section;
      });

      if (i < args.entries.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
        );
      }
    }
  }

  if (args.includePagination === true && args.totalPages > 1) {
    const buttons = buildTeamXpLeaderboardPaginationButtons({
      page: args.page,
      totalPages: args.totalPages,
    });
    container.addActionRowComponents((row) => row.addComponents(...buttons));
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(TEAM_XP_PANEL_BANNER_URL),
    ),
  );

  return container;
}

export function buildTeamXpLeaderboardPaginationButtons(args: {
  page: number;
  totalPages: number;
}): ButtonBuilder[] {
  return [
    new ButtonBuilder()
      .setCustomId(buildTeamXpLeaderboardPrevButtonCustomId(args.page))
      .setEmoji(EMOJIS.LINKS)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(args.page <= 1),
    new ButtonBuilder()
      .setCustomId(buildTeamXpLeaderboardNextButtonCustomId(args.page))
      .setEmoji(EMOJIS.RECHTS)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(args.page >= args.totalPages),
  ];
}
