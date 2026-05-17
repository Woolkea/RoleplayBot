import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";

import { escapeMarkdown } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

export function buildXpBoostRolePingTextDisplay(pingRoleId: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(`<@&${pingRoleId}>`);
}

export function buildXpBoostAnnouncementContainer(args: {
  percent: number;
  durationHours: number;
  setterUserId: string;
  reason: string;
  titleStrikethrough?: boolean;
}): ContainerBuilder {
  const reasonTrim = args.reason.trim();
  const reasonDisplay = escapeMarkdown(reasonTrim.replaceAll("`", "'"));
  const boostTitleRest = `+${String(args.percent)} % XP Boost`;
  const heading = args.titleStrikethrough
    ? `# ${emojiToString(EMOJIS.XP_BOOST_UP)} ~~${boostTitleRest}~~`
    : `# ${emojiToString(EMOJIS.XP_BOOST_UP)} ${boostTitleRest}`;
  const body =
    `${heading}\n` +
    `> **Gesetzt von:** <@${args.setterUserId}>\n` +
    `> **Dauer:** ${String(args.durationHours)}h\n` +
    `> **Grund:** ${reasonDisplay}`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}

export function buildXpBoostEndedReplyContainer(): ContainerBuilder {
  const body = `# ${emojiToString(EMOJIS.SUCCESS)} XP Boost ist nun wieder vorbei.`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}
