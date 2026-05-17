import {
  ButtonBuilder,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";

import { ButtonStyle, escapeMarkdown, MessageFlags, SeparatorSpacingSize } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { ROBLOX_PROFILE_BASE } from "@/integrations/roblox/constants.js";

import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

import { buildRobloxHeadshotImageUrl } from "@/integrations/roblox/users.js";

import {
  buildRobloxLinkCancelButtonCustomId,
  buildRobloxLinkConfirmButtonCustomId,
} from "@/interactions/custom-ids.js";

import type { RobloxLinkRow } from "@/repositories/roblox-links.js";

import { discordRelativeTimestamp } from "../ingame-moderation/ui-builders.js";

export function robloxLinkV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

function profileWithThumbnailSection(body: string, profile: RobloxPublicProfile): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .setThumbnailAccessory((thumb) =>
      thumb
        .setURL(profile.headshotUrl)
        .setDescription(`${escapeMarkdown(profile.displayName)} — Roblox`),
    );
}

export function buildRobloxLinkPreviewContainer(args: {
  flowId: string;
  profile: RobloxPublicProfile;
}): ContainerBuilder {
  const dn = escapeMarkdown(args.profile.displayName);
  const un = escapeMarkdown(args.profile.name);
  const accountCreated =
    args.profile.created !== null ? discordRelativeTimestamp(args.profile.created) : "unbekannt";
  const body =
    `# ${emojiToString(EMOJIS.BERECHTIGT)} Richtiger Account?\n` +
    `> **Spieler:** ${dn} (@${un})\n` +
    `> **ID:** \`${args.profile.id}\`\n` +
    `> **Account erstellt:** ${accountCreated}`;

  return new ContainerBuilder()
    .addSectionComponents(profileWithThumbnailSection(body, args.profile))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Roblox Profil")
          .setURL(args.profile.profileUrl),
        new ButtonBuilder()
          .setCustomId(buildRobloxLinkCancelButtonCustomId(args.flowId))
          .setLabel("Nein, abbrechen")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(buildRobloxLinkConfirmButtonCustomId(args.flowId))
          .setLabel("Ja, richtig")
          .setStyle(ButtonStyle.Success),
      ),
    );
}

function storedLinkAsProfile(link: RobloxLinkRow): RobloxPublicProfile {
  const headshotUrl = link.robloxAvatarUrl ?? buildRobloxHeadshotImageUrl(link.robloxUserId);

  return {
    id: link.robloxUserId,
    name: link.robloxUsername,
    displayName: link.robloxDisplayName,
    created: link.robloxCreatedAt,
    headshotUrl,
    profileUrl: `${ROBLOX_PROFILE_BASE}/${link.robloxUserId}/profile`,
  };
}

export function buildRobloxStoredLinkViewContainer(link: RobloxLinkRow): ContainerBuilder {
  const profile = storedLinkAsProfile(link);
  const dn = escapeMarkdown(profile.displayName);
  const un = escapeMarkdown(profile.name);
  const accountCreated =
    profile.created !== null ? discordRelativeTimestamp(profile.created) : "unbekannt";
  const body =
    `# ${emojiToString(EMOJIS.BERECHTIGT)} Verknüpfter Account\n` +
    `> **Spieler:** ${dn} (@${un})\n` +
    `> **ID:** \`${profile.id}\`\n` +
    `> **Account erstellt:** ${accountCreated}`;

  return new ContainerBuilder()
    .addSectionComponents(profileWithThumbnailSection(body, profile))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Roblox Profil")
          .setURL(profile.profileUrl),
      ),
    );
}
