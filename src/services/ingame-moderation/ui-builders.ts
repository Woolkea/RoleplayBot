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
  TextInputStyle,
  SeparatorSpacingSize,
} from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import {
  buildIngameCancelButtonCustomId,
  buildIngameConfirmButtonCustomId,
  buildIngameDeleteButtonCustomId,
  buildIngameHistoryPageButtonCustomId,
  ingameBtnGetUserId,
  ingameBtnHistory,
  ingameFieldBanDuration,
  ingameFieldReason,
  ingameFieldServer,
  ingameFieldUsername,
  ingameModalBan,
  ingameModalGetUserId,
  ingameModalHistory,
  ingameModalKick,
  ingameModalUnban,
  ingameModalWarn,
  ingameSelectAction,
} from "@/interactions/custom-ids.js";

import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

import type { IngameAction } from "./flow-cache.js";

import { type ServerShard } from "@/interactions/custom-ids.js";

export function discordRelativeTimestamp(date: Date): string {
  return `<t:${String(Math.floor(date.getTime() / 1000))}:R>`;
}

function profileWithThumbnailSection(body: string, profile: RobloxPublicProfile): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .setThumbnailAccessory((thumb) =>
      thumb.setURL(profile.headshotUrl).setDescription(`${profile.displayName} — Roblox`),
    );
}

export function ingameV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export function buildIngamePanelContainer(): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${emojiToString(EMOJIS.ENTRY)} Ingame Moderation`),
      new TextDisplayBuilder().setContent(
        `${emojiToString(EMOJIS.LINE)} Wähle im Menü eine Bestrafung aus.`,
      ),
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(ingameSelectAction)
          .setPlaceholder("Aktion wählen")
          .addOptions(
            { label: "Spieler verwarnen...", value: "warn", emoji: EMOJIS.WARN_WHITE },
            { label: "Spieler kicken...", value: "kick", emoji: EMOJIS.KICK_WHITE },
            { label: "Spieler bannen...", value: "ban", emoji: EMOJIS.BAN_WHITE },
            { label: "Spieler entbannen...", value: "unban", emoji: EMOJIS.GERICHT_WHITE },
          ),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setSpacing(SeparatorSpacingSize.Large),
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(ingameBtnHistory)
          .setLabel("Spielerverlauf")
          .setEmoji(EMOJIS.HISTORY_WHITE)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(ingameBtnGetUserId)
          .setLabel("Getuserid")
          .setEmoji(EMOJIS.ID_WHITE)
          .setStyle(ButtonStyle.Secondary),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setSpacing(SeparatorSpacingSize.Large),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(
          "https://media.discordapp.net/attachments/1500208165307027587/1500837090668052640/LunarRP.png?ex=69fb3476&is=69f9e2f6&hm=dcaf2ed48037580b5127d01f270d96230866fe2f2cf9af0b46a56122cb077a55&=&format=webp&quality=lossless&width=1872&height=52",
        ),
      ),
    );
}

function serverSelect(): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId(ingameFieldServer)
    .addOptions({ label: "Server 1", value: "s1" }, { label: "Server 2", value: "s2" });
}

function usernameInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(ingameFieldUsername)
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(64)
    .setRequired(true);
}

function reasonInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(ingameFieldReason)
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setMaxLength(1000)
    .setRequired(true);
}

function banDurationInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(ingameFieldBanDuration)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(80)
    .setRequired(true)
    .setPlaceholder("1–365 Tagen | P = Permanent");
}

export function buildWarnModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ingameModalWarn)
    .setTitle("Spieler verwarnen...")
    .addLabelComponents(
      new LabelBuilder().setLabel("Server").setStringSelectMenuComponent(serverSelect()),
      new LabelBuilder().setLabel("Roblox Benutzername").setTextInputComponent(usernameInput()),
      new LabelBuilder().setLabel("Grund").setTextInputComponent(reasonInput()),
    );
}

export function buildKickModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ingameModalKick)
    .setTitle("Spieler kicken...")
    .addLabelComponents(
      new LabelBuilder().setLabel("Server").setStringSelectMenuComponent(serverSelect()),
      new LabelBuilder().setLabel("Roblox Benutzername").setTextInputComponent(usernameInput()),
      new LabelBuilder().setLabel("Grund").setTextInputComponent(reasonInput()),
    );
}

export function buildBanModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ingameModalBan)
    .setTitle("Spieler bannen...")
    .addLabelComponents(
      new LabelBuilder().setLabel("Server").setStringSelectMenuComponent(serverSelect()),
      new LabelBuilder().setLabel("Bann-Dauer").setTextInputComponent(banDurationInput()),
      new LabelBuilder().setLabel("Roblox Benutzername").setTextInputComponent(usernameInput()),
      new LabelBuilder().setLabel("Grund").setTextInputComponent(reasonInput()),
    );
}

export function buildUnbanModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ingameModalUnban)
    .setTitle("Spieler entbannen...")
    .addLabelComponents(
      new LabelBuilder().setLabel("Server").setStringSelectMenuComponent(serverSelect()),
      new LabelBuilder().setLabel("Roblox Benutzername").setTextInputComponent(usernameInput()),
      new LabelBuilder().setLabel("Grund").setTextInputComponent(reasonInput()),
    );
}

export function buildHistoryModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ingameModalHistory)
    .setTitle("Spielerverlauf")
    .addLabelComponents(
      new LabelBuilder().setLabel("Roblox Benutzername").setTextInputComponent(usernameInput()),
    );
}

export function buildGetUserIdModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ingameModalGetUserId)
    .setTitle("Roblox UserId")
    .addLabelComponents(
      new LabelBuilder().setLabel("Roblox Benutzername").setTextInputComponent(usernameInput()),
    );
}

export function buildGetUserIdResultContainer(profile: RobloxPublicProfile): ContainerBuilder {
  const dn = escapeMarkdown(profile.displayName);
  const un = escapeMarkdown(profile.name);
  const accountCreated =
    profile.created !== null ? discordRelativeTimestamp(profile.created) : "unbekannt";
  const body =
    `# ${emojiToString(EMOJIS.INFORMATION)} Informationen zu ${dn}\n` +
    `> **Spieler:** ${dn} (@${un})\n` +
    `> **ID:** \`${profile.id}\`\n` +
    `> **Account erstellt:** ${accountCreated}`;

  return new ContainerBuilder().addSectionComponents(profileWithThumbnailSection(body, profile));
}

export function formatPunishmentLinePreview(args: {
  action: IngameAction;
  banIsPermanent: boolean;
  banDurationDays: number | null;
  includePrefix?: boolean;
}): string {
  const prefix = args.includePrefix
    ? args.action === "unban"
      ? "**Aktion:** "
      : "**Bestrafung:** "
    : "";

  if (args.action === "unban") {
    return `${prefix}**Entbannung**`;
  }

  if (args.action === "warn") {
    return `${prefix}**Warn**`;
  }

  if (args.action === "kick") {
    return `${prefix}**Kick**`;
  }

  if (args.banIsPermanent) {
    return `${prefix}**Permanent gebannt**`;
  }

  if (args.banDurationDays !== null) {
    return `${prefix}**${String(args.banDurationDays)}-Tage-Ban**`;
  }

  return `${prefix}**Ban**`;
}

export function formatPunishmentLineLog(args: {
  action: IngameAction;
  banIsPermanent: boolean;
  banDurationDays: number | null;
}): string {
  if (args.action === "unban") {
    return "**Aktion:** Entbannt";
  }

  if (args.action === "warn") {
    return "**Bestrafung:** Warn";
  }

  if (args.action === "kick") {
    return "**Bestrafung:** Kick";
  }

  if (args.banIsPermanent) {
    return "**Bestrafung:** Permanent gebannt";
  }

  if (args.banDurationDays !== null) {
    return `**Bestrafung:** ${String(args.banDurationDays)}-Tage-Ban`;
  }

  return "**Bestrafung:** Ban";
}

export function buildPreviewContainer(args: {
  flowId: string;
  profile: RobloxPublicProfile;
  punishmentLine: string;
  reason: string;
}): ContainerBuilder {
  const body =
    `# ${emojiToString(EMOJIS.BERECHTIGT)} Bestrafung prüfen\n` +
    `> **Spieler:** ${escapeMarkdown(args.profile.displayName)} (@${escapeMarkdown(args.profile.name)})\n` +
    `> ${args.punishmentLine}\n` +
    `> **Grund:** \`${args.reason.replaceAll("`", "'")}\``;

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
          .setCustomId(buildIngameCancelButtonCustomId(args.flowId))
          .setLabel("Abbrechen")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(buildIngameConfirmButtonCustomId(args.flowId))
          .setLabel("Bestätigen")
          .setStyle(ButtonStyle.Success),
      ),
    );
}

export function buildLogContainer(args: {
  entryId: number;
  title: string;
  profile: RobloxPublicProfile;
  moderatorMention: string;
  punishmentLine: string;
  reason: string;
}): ContainerBuilder {
  const topBody =
    `${args.title}\n` +
    `> **Spieler:** ${escapeMarkdown(args.profile.displayName)} (@${escapeMarkdown(args.profile.name)})\n` +
    `> **Moderator:** ${args.moderatorMention}`;
  const bottomBody =
    `> ${args.punishmentLine}\n` + `> **Grund:** \`${args.reason.replaceAll("`", "'")}\``;

  return new ContainerBuilder()
    .addSectionComponents(profileWithThumbnailSection(topBody, args.profile))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(bottomBody))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Roblox Profil")
          .setURL(args.profile.profileUrl),
        new ButtonBuilder()
          .setCustomId(buildIngameDeleteButtonCustomId(args.entryId))
          .setLabel("Löschen")
          .setStyle(ButtonStyle.Danger),
      ),
    );
}

export function buildHistoryContainers(args: {
  profile: RobloxPublicProfile;
  server1Entries: Array<{
    content: string;
    entryId: number;
  }>;
  server2Entries: Array<{
    content: string;
    entryId: number;
  }>;
  s1Page: number;
  s2Page: number;
}): ContainerBuilder[] {
  const ITEMS_PER_PAGE = 5;
  const dn = escapeMarkdown(args.profile.displayName);
  const un = escapeMarkdown(args.profile.name);
  const accountCreated =
    args.profile.created !== null ? discordRelativeTimestamp(args.profile.created) : "unbekannt";
  const headerText =
    `# ${emojiToString(EMOJIS.ZEIT)} Bestrafungsverlauf von ${dn}\n` +
    `> **Spieler:** ${dn} (@${un})\n` +
    `> **Account erstellt:** ${accountCreated}`;
  const header = new ContainerBuilder().addSectionComponents(
    profileWithThumbnailSection(headerText, args.profile),
  );
  const s1TotalPages = Math.max(1, Math.ceil(args.server1Entries.length / ITEMS_PER_PAGE));
  const s1CurrentPage = Math.min(args.s1Page, s1TotalPages);
  const s1Start = (s1CurrentPage - 1) * ITEMS_PER_PAGE;
  const s1End = s1Start + ITEMS_PER_PAGE;
  const s1EntriesPage = args.server1Entries.slice(s1Start, s1End);
  const s1 = new ContainerBuilder();
  const s1Title =
    s1TotalPages > 1
      ? `## Server 1 - Seite ${String(s1CurrentPage)}/${String(s1TotalPages)}`
      : "## Server 1";
  s1.addTextDisplayComponents(new TextDisplayBuilder().setContent(s1Title));

  if (args.server1Entries.length === 0) {
    s1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emojiToString(EMOJIS.LINE)}Keine Einträge vorhanden.`),
    );
  } else {
    for (let i = 0; i < s1EntriesPage.length; i++) {
      const entry = s1EntriesPage[i];
      s1.addSectionComponents((section) =>
        section
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(entry.content))
          .setButtonAccessory((btn) =>
            btn
              .setCustomId(buildIngameDeleteButtonCustomId(entry.entryId))
              .setEmoji(EMOJIS.ENTFERNEN)
              .setStyle(ButtonStyle.Secondary),
          ),
      );

      if (i < s1EntriesPage.length - 1) {
        s1.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      }
    }
  }

  if (s1TotalPages > 1) {
    s1.addActionRowComponents((row) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(
            buildIngameHistoryPageButtonCustomId({
              robloxUserId: args.profile.id,
              s1Page: Math.max(1, s1CurrentPage - 1),
              s2Page: args.s2Page,
              serverShard: "s1",
              direction: "prev",
            }),
          )
          .setEmoji(EMOJIS.LINKS)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(s1CurrentPage <= 1),
        new ButtonBuilder()
          .setCustomId(
            buildIngameHistoryPageButtonCustomId({
              robloxUserId: args.profile.id,
              s1Page: Math.min(s1TotalPages, s1CurrentPage + 1),
              s2Page: args.s2Page,
              serverShard: "s1",
              direction: "next",
            }),
          )
          .setEmoji(EMOJIS.RECHTS)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(s1CurrentPage >= s1TotalPages),
      );

      return row;
    });
  }

  const s2TotalPages = Math.max(1, Math.ceil(args.server2Entries.length / ITEMS_PER_PAGE));
  const s2CurrentPage = Math.min(args.s2Page, s2TotalPages);
  const s2Start = (s2CurrentPage - 1) * ITEMS_PER_PAGE;
  const s2End = s2Start + ITEMS_PER_PAGE;
  const s2EntriesPage = args.server2Entries.slice(s2Start, s2End);
  const s2 = new ContainerBuilder();
  const s2Title =
    s2TotalPages > 1
      ? `## Server 2 - Seite ${String(s2CurrentPage)}/${String(s2TotalPages)}`
      : "## Server 2";
  s2.addTextDisplayComponents(new TextDisplayBuilder().setContent(s2Title));

  if (args.server2Entries.length === 0) {
    s2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emojiToString(EMOJIS.LINE)}Keine Einträge vorhanden.`),
    );
  } else {
    for (let i = 0; i < s2EntriesPage.length; i++) {
      const entry = s2EntriesPage[i];
      s2.addSectionComponents((section) =>
        section
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(entry.content))
          .setButtonAccessory((btn) =>
            btn
              .setCustomId(buildIngameDeleteButtonCustomId(entry.entryId))
              .setEmoji(EMOJIS.ENTFERNEN)
              .setStyle(ButtonStyle.Secondary),
          ),
      );

      if (i < s2EntriesPage.length - 1) {
        s2.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      }
    }
  }

  if (s2TotalPages > 1) {
    s2.addActionRowComponents((row) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(
            buildIngameHistoryPageButtonCustomId({
              robloxUserId: args.profile.id,
              s1Page: args.s1Page,
              s2Page: Math.max(1, s2CurrentPage - 1),
              serverShard: "s2",
              direction: "prev",
            }),
          )
          .setEmoji(EMOJIS.LINKS)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(s2CurrentPage <= 1),
        new ButtonBuilder()
          .setCustomId(
            buildIngameHistoryPageButtonCustomId({
              robloxUserId: args.profile.id,
              s1Page: args.s1Page,
              s2Page: Math.min(s2TotalPages, s2CurrentPage + 1),
              serverShard: "s2",
              direction: "next",
            }),
          )
          .setEmoji(EMOJIS.RECHTS)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(s2CurrentPage >= s2TotalPages),
      );

      return row;
    });
  }

  return [header, s1, s2];
}

export function formatHistoryEntry(args: {
  createdAt: Date;
  action: IngameAction;
  reason: string;
  moderatorDiscordUserId: string;
  banIsPermanent: boolean;
  banDurationDays: number | null;
}): string {
  const time = discordRelativeTimestamp(args.createdAt);
  const punishment = formatPunishmentLinePreview({
    action: args.action,
    banIsPermanent: args.banIsPermanent,
    banDurationDays: args.banDurationDays,
  });

  return (
    `**${time}** - ${punishment}\n` +
    `> **Moderator:** <@${args.moderatorDiscordUserId}>\n` +
    `> **Grund:** \`${args.reason.replaceAll("`", "'")}\``
  );
}

export function parseServerShard(value: string): ServerShard | undefined {
  if (value === "s1" || value === "s2") {
    return value;
  }

  return undefined;
}

export function logTitleForAction(action: IngameAction, banIsPermanent: boolean): string {
  if (action === "unban") {
    return `# ${emojiToString(EMOJIS.GERICHT)} Spieler entbannt`;
  }

  if (action === "warn") {
    return `# ${emojiToString(EMOJIS.WARNUNG)} Spieler gewarnt`;
  }

  if (action === "kick") {
    return `# ${emojiToString(EMOJIS.KICK)} Spieler gekickt`;
  }

  if (banIsPermanent) {
    return `# ${emojiToString(EMOJIS.BAN)} Spieler permanent gebannt`;
  }

  return `# ${emojiToString(EMOJIS.BAN)} Spieler gebannt`;
}
