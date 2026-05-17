import {
  ButtonBuilder,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";

import { ButtonStyle, escapeMarkdown, MessageFlags, SeparatorSpacingSize } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import {
  buildDizzyLinkCancelButtonCustomId,
  buildDizzyLinkConfirmButtonCustomId,
} from "@/interactions/custom-ids.js";

import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

export function dizzyRobloxV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

function profileSection(body: string, profile: RobloxPublicProfile): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .setThumbnailAccessory((thumb) =>
      thumb.setURL(profile.headshotUrl).setDescription(`${profile.displayName} — Roblox`),
    );
}

export function buildDizzyLinkStickyContainer(): ContainerBuilder {
  const body =
    `# ${emojiToString(EMOJIS.KONTROLLE)} Dizzy-Kontrolle\n` +
    `${emojiToString(EMOJIS.LINE)} Schreibe deinen Roblox-**Benutzernamen** hier rein!`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}

export function buildDizzyRobloxLinkPreviewContainer(args: {
  flowId: string;
  profile: RobloxPublicProfile;
  title: string;
  actionLine?: string;
  reasonLine?: string;
}): ContainerBuilder {
  const lines = [
    `# ${emojiToString(EMOJIS.BERECHTIGT)} ${args.title}`,
    `> **Spieler:** ${escapeMarkdown(args.profile.displayName)} (@${escapeMarkdown(args.profile.name)})`,
  ];

  if (args.actionLine !== undefined && args.actionLine !== "") {
    lines.push(`> ${args.actionLine}`);
  }

  if (args.reasonLine !== undefined && args.reasonLine !== "") {
    lines.push(`> ${args.reasonLine}`);
  }

  const body = lines.join("\n");

  return new ContainerBuilder()
    .addSectionComponents(profileSection(body, args.profile))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Roblox Profil")
          .setURL(args.profile.profileUrl),
        new ButtonBuilder()
          .setCustomId(buildDizzyLinkCancelButtonCustomId(args.flowId))
          .setLabel("Abbrechen")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(buildDizzyLinkConfirmButtonCustomId(args.flowId))
          .setLabel("Bestätigen")
          .setStyle(ButtonStyle.Success),
      ),
    );
}

export function buildDizzyRobloxLinkResultText(args: { ok: boolean; text: string }): string {
  const icon = args.ok ? emojiToString(EMOJIS.SUCCESS) : emojiToString(EMOJIS.VERBOT);

  return `# ${icon} ${args.text}`;
}
