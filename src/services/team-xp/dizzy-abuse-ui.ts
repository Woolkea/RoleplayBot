import { ButtonBuilder, ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";

import { ButtonStyle, MessageFlags } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { buildDizzyAbuseRevertButtonCustomId } from "@/interactions/custom-ids.js";

export function dizzyAbuseV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

const THANKS = "# Danke für die Meldung!\n\n" + "Wir schauen uns das intern an.";

export function buildDizzyAbuseReportThanksContainer(): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(THANKS),
  );
}

const MAX_REPORTER_MENTIONS = 18;

export function buildDizzyAbusePenaltyAnnouncementContainer(args: {
  moderatorUserId: string;
  reporterUserIds: string[];
  xpBefore: number;
  xpAfter: number;
  penaltyId: number;
}): ContainerBuilder {
  const mentions = args.reporterUserIds.slice(0, MAX_REPORTER_MENTIONS).map((id) => `<@${id}>`);
  const extra = args.reporterUserIds.length - mentions.length;
  const reporterLine =
    extra > 0 ? `${mentions.join(" ")} … **+${String(extra)} weitere**` : mentions.join(" ");
  const body =
    `# ${emojiToString(EMOJIS.ANGRY)} Ein Dieb wurde bestraft\n` +
    `> **Teammitglied:** <@${args.moderatorUserId}>\n` +
    `> **Gemeldet von:** ${reporterLine}\n` +
    `> **Aktion:** XP-Änderung **${String(args.xpBefore)} → ${String(args.xpAfter)}**`;

  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(buildDizzyAbuseRevertButtonCustomId(args.penaltyId))
          .setLabel("Zurücksetzen")
          .setStyle(ButtonStyle.Danger),
      ),
    );
}

export function buildDizzyAbusePenaltyRevertedContainer(args: {
  revertedByUserId: string;
  revertedAtIso: string;
}): ContainerBuilder {
  const body =
    `# ${emojiToString(EMOJIS.SUCCESS)} Strafe zurückgenommen\n` +
    `> **Zurückgesetzt von:** <@${args.revertedByUserId}>\n` +
    `> **Zeitpunkt:** ${args.revertedAtIso}`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}
