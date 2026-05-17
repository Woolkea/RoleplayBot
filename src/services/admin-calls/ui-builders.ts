import {
  ButtonBuilder,
  ContainerBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ModalBuilder,
  SectionBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
} from "@discordjs/builders";

import {
  ButtonStyle,
  escapeMarkdown,
  MessageFlags,
  SeparatorSpacingSize,
  TextInputStyle,
} from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { ROBLOX_PROFILE_BASE } from "@/integrations/roblox/constants.js";

import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

import { buildRobloxHeadshotImageUrl } from "@/integrations/roblox/users.js";

import {
  adminCallBtnOpen,
  adminCallFieldLocation,
  adminCallFieldReason,
  adminCallFieldServer,
  adminCallFieldUsername,
  adminCallModalSubmit,
  buildAdminCallCancelButtonCustomId,
  buildAdminCallClaimButtonCustomId,
  buildAdminCallConfirmButtonCustomId,
  type ServerShard,
} from "@/interactions/custom-ids.js";

import { FEEDBACK_BANNER_URL } from "@/services/feedback/ui-builders.js";

import { ADMIN_CALL_LOG_ACCENT_CLAIMED, ADMIN_CALL_LOG_ACCENT_OPEN } from "./constants.js";

const DISCORD_SNOWFLAKE_RE = /^\d{17,22}$/;

function isDiscordSnowflake(value: string): boolean {
  return DISCORD_SNOWFLAKE_RE.test(value.trim());
}

const DISCORD_BUTTON_LABEL_MAX = 80;

function truncateDiscordButtonLabel(text: string): string {
  if (text.length <= DISCORD_BUTTON_LABEL_MAX) {
    return text;
  }

  return `${text.slice(0, DISCORD_BUTTON_LABEL_MAX - 1)}…`;
}

export function adminCallV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

function profileWithThumbnailSection(body: string, profile: RobloxPublicProfile): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .setThumbnailAccessory((thumb) =>
      thumb.setURL(profile.headshotUrl).setDescription(`${profile.displayName} — Roblox`),
    );
}

function serverSelect(): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId(adminCallFieldServer)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions({ label: "Server 1", value: "s1" }, { label: "Server 2", value: "s2" });
}

function robloxUsernameInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(adminCallFieldUsername)
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(64)
    .setRequired(true);
}

function locationInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(adminCallFieldLocation)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(200)
    .setRequired(true);
}

function reasonInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(adminCallFieldReason)
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setMaxLength(1000)
    .setRequired(true);
}

export function formatAdminCallServerLabel(shard: ServerShard): string {
  return shard === "s1" ? "Server 1" : "Server 2";
}

export function buildAdminCallPanelContainer(): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${emojiToString(EMOJIS.ADMIN_CALL)} Admin rufen`),
      new TextDisplayBuilder().setContent(
        `> Du brauchst **Ingame** einen Admin? Nutze das Formular — unser Team sieht den Eintrag im Log-Kanal und kann ihn übernehmen.`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(adminCallBtnOpen)
          .setLabel("Admin rufen")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.ADMIN_CALL_WHITE),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(FEEDBACK_BANNER_URL)),
    );
}

export function buildAdminCallModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(adminCallModalSubmit)
    .setTitle("Admin rufen")
    .addLabelComponents(
      new LabelBuilder().setLabel("Server").setStringSelectMenuComponent(serverSelect()),
      new LabelBuilder()
        .setLabel("Roblox Benutzername")
        .setTextInputComponent(robloxUsernameInput()),
      new LabelBuilder().setLabel("Ort").setTextInputComponent(locationInput()),
      new LabelBuilder().setLabel("Grund").setTextInputComponent(reasonInput()),
    );
}

export function buildAdminCallPreviewContainer(args: {
  flowId: string;
  profile: RobloxPublicProfile;
  serverLabel: string;
  location: string;
  reason: string;
}): ContainerBuilder {
  const locEsc = escapeMarkdown(args.location.replaceAll("`", "'"));
  const reasonEsc = escapeMarkdown(args.reason.replaceAll("`", "'"));
  const body =
    `# ${emojiToString(EMOJIS.BERECHTIGT)} Admin Call prüfen\n` +
    `> **Spieler:** ${escapeMarkdown(args.profile.displayName)} (@${escapeMarkdown(args.profile.name)})\n` +
    `> **Server:** ${escapeMarkdown(args.serverLabel)}\n` +
    `> **Ort:** \`${locEsc}\`\n` +
    `> **Grund:** \`${reasonEsc}\``;

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
          .setCustomId(buildAdminCallCancelButtonCustomId(args.flowId))
          .setLabel("Abbrechen")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(buildAdminCallConfirmButtonCustomId(args.flowId))
          .setLabel("Bestätigen")
          .setStyle(ButtonStyle.Success),
      ),
    );
}

export type AdminCallLogContainerArgs = {
  callId: number;
  authorDiscordUserId: string;
  robloxUserId: string;
  robloxAvatarUrl?: string | null;
  serverLabel: string;
  robloxDisplayName: string;
  robloxUsername: string;
  location: string;
  reason: string;
  status: "open" | "claimed";
  claimedByDiscordUserId: string | null;
  claimedByDisplayName?: string | null;
  pingRoleId?: string;
};

export function buildAdminCallLogContainer(args: AdminCallLogContainerArgs): ContainerBuilder {
  const locEsc = escapeMarkdown(args.location.replaceAll("`", "'"));
  const reasonEsc = escapeMarkdown(args.reason.replaceAll("`", "'"));
  const dnEsc = escapeMarkdown(args.robloxDisplayName);
  const unEsc = escapeMarkdown(args.robloxUsername);
  const headshotUrl = args.robloxAvatarUrl ?? buildRobloxHeadshotImageUrl(args.robloxUserId);
  const titleEmoji = args.status === "open" ? EMOJIS.ADMIN_CALL : EMOJIS.BERECHTIGT;
  const body =
    `# ${emojiToString(titleEmoji)} Admin Call\n` +
    `> **Von:** <@${args.authorDiscordUserId}>\n` +
    `> **Spieler:** ${dnEsc} (@${unEsc})\n` +
    `> **Server:** ${escapeMarkdown(args.serverLabel)}\n` +
    `> **Ort:** \`${locEsc}\`\n` +
    `> **Grund:** \`${reasonEsc}\``;
  const profileForThumbnail: RobloxPublicProfile = {
    id: args.robloxUserId,
    name: args.robloxUsername,
    displayName: args.robloxDisplayName,
    created: null,
    headshotUrl,
    profileUrl: `${ROBLOX_PROFILE_BASE}/${args.robloxUserId}/profile`,
  };
  const claimDisabled = args.status !== "open";
  const claimerName =
    args.claimedByDisplayName !== undefined &&
    args.claimedByDisplayName !== null &&
    args.claimedByDisplayName !== ""
      ? args.claimedByDisplayName
      : "Teammitglied";
  const claimButtonLabel =
    args.status === "open"
      ? "Übernehmen"
      : truncateDiscordButtonLabel(`Übernommen von ${claimerName}`);
  const accentColor =
    args.status === "open" ? ADMIN_CALL_LOG_ACCENT_OPEN : ADMIN_CALL_LOG_ACCENT_CLAIMED;
  const root = new ContainerBuilder().setAccentColor(accentColor);

  if (
    args.status === "open" &&
    args.pingRoleId !== undefined &&
    isDiscordSnowflake(args.pingRoleId)
  ) {
    root.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`<@&${args.pingRoleId.trim()}>`),
    );
  }

  return root
    .addSectionComponents(profileWithThumbnailSection(body, profileForThumbnail))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(buildAdminCallClaimButtonCustomId(args.callId))
          .setLabel(claimButtonLabel)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.ERFOLGREICH_WHITE)
          .setDisabled(claimDisabled),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(FEEDBACK_BANNER_URL)),
    );
}

export type AdminCallLogPayload = {
  components: ContainerBuilder[];
};

export function buildAdminCallLogPayload(args: AdminCallLogContainerArgs): AdminCallLogPayload {
  return { components: [buildAdminCallLogContainer(args)] };
}

export function buildAdminCallConfirmSuccessContainer(): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${emojiToString(EMOJIS.SUCCESS)} Admin Call gesendet\n\n` +
        `> Ein Admin wird so schnell wie möglich bei dir vorbeischauen.`,
    ),
  );
}
