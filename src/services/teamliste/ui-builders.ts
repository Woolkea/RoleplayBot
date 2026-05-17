import {
  ButtonBuilder,
  ContainerBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
} from "@discordjs/builders";

import {
  ButtonStyle,
  escapeMarkdown,
  MessageFlags,
  TextInputStyle,
  type Guild,
  type MessageMentionOptions,
  SeparatorSpacingSize,
} from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import type { RobloxLinkRow } from "@/repositories/roblox-links.js";

import type { TeamlisteCategoryRow } from "@/repositories/teamliste.js";

import {
  buildTeamlisteDeleteRowButtonCustomId,
  buildTeamlisteEditRowButtonCustomId,
  buildTeamlisteModalEditCustomId,
  teamlisteBtnCreate,
  teamlisteFieldName,
  teamlisteFieldRoles,
  teamlisteModalCreate,
} from "@/interactions/custom-ids.js";

const TEAM_LISTE_TITLE = `# ${emojiToString(EMOJIS.TEAM)} Teamliste`;

export const TEAM_LISTE_PANEL_BANNER_URL =
  "https://media.discordapp.net/attachments/1500208165307027587/1500837090668052640/LunarRP.png?ex=69fb3476&is=69f9e2f6&hm=dcaf2ed48037580b5127d01f270d96230866fe2f2cf9af0b46a56122cb077a55&=&format=webp&quality=lossless&width=1872&height=52";

export const TEAM_LISTE_PANEL_CONTINUATION_BANNER_URL =
  "https://cdn.discordapp.com/attachments/1371110175448240251/1501712925918756914/GAA.png";
const TEAMLISTE_ADMIN_MAX_CATEGORIES = 8;
const DISCORD_COMPONENTS_V2_DISPLAYABLE_TEXT_MAX = 4000;

export function teamlisteV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export const teamlistePanelAllowedMentions: MessageMentionOptions = {
  parse: [],
  users: [],
  roles: [],
  repliedUser: false,
};

function safeCode(s: string): string {
  return s.replaceAll("`", "'");
}

export function sortTeamlisteRoleIdsByHierarchy(
  guild: Guild,
  roleIds: readonly string[],
): string[] {
  return [...roleIds].sort((a, b) => {
    const ra = guild.roles.cache.get(a);
    const rb = guild.roles.cache.get(b);
    const pa = ra?.position ?? -1;
    const pb = rb?.position ?? -1;

    if (pb !== pa) {
      return pb - pa;
    }

    return a.localeCompare(b);
  });
}

function buildTeamlisteCategoryMarkdownBody(args: {
  guild: Guild;
  cat: TeamlisteCategoryRow;
  robloxMap: ReadonlyMap<string, RobloxLinkRow>;
}): string {
  const { guild, cat, robloxMap } = args;
  const uniqueMembers = new Set<string>();

  for (const rid of cat.roles) {
    const role = guild.roles.cache.get(rid);

    if (role) {
      for (const m of role.members.values()) uniqueMembers.add(m.id);
    }
  }

  const count = uniqueMembers.size;
  const lines: string[] = [];
  lines.push(`## ${escapeMarkdown(cat.name)} (${String(count)})`);
  const rolesOrdered = sortTeamlisteRoleIdsByHierarchy(guild, cat.roles);

  if (rolesOrdered.length === 0) {
    lines.push("*(Keine Rollen)*");
  } else {
    for (let rIdx = 0; rIdx < rolesOrdered.length; rIdx++) {
      const rid = rolesOrdered[rIdx];
      lines.push(`<@&${rid}>`);
      const role = guild.roles.cache.get(rid);
      const roleMembers = role
        ? Array.from(role.members.values()).sort((a, b) =>
            a.displayName.localeCompare(b.displayName, "de", { sensitivity: "base" }),
          )
        : [];

      if (roleMembers.length === 0) {
        lines.push(`${emojiToString(EMOJIS.LINE)} *(Leer)*`);
      } else {
        for (let j = 0; j < roleMembers.length; j++) {
          const m = roleMembers[j];
          const link = robloxMap.get(m.id);
          const robloxSuffix = link !== undefined ? ` \`${safeCode(link.robloxUsername)}\`` : "";
          let prefixEmoji = "";

          if (roleMembers.length === 1) {
            prefixEmoji = emojiToString(EMOJIS.LINE);
          } else if (j === 0) {
            prefixEmoji = emojiToString(EMOJIS.LINIE_LANG_OBEN);
          } else if (j === roleMembers.length - 1) {
            prefixEmoji = emojiToString(EMOJIS.LINE);
          } else {
            prefixEmoji = emojiToString(EMOJIS.LINE_LANG);
          }

          lines.push(`${prefixEmoji} <@${m.id}>${robloxSuffix}`);
        }
      }

      if (rIdx < rolesOrdered.length - 1) {
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

function chunkMarkdownPreservingLines(body: string, maxChars: number): string[] {
  if (body.length <= maxChars) {
    return [body];
  }

  const lines = body.split("\n");
  const chunks: string[] = [];
  const currentLines: string[] = [];

  const flush = (): void => {
    if (currentLines.length === 0) {
      return;
    }

    chunks.push(currentLines.join("\n"));
    currentLines.length = 0;
  };

  for (const line of lines) {
    if (line.length > maxChars) {
      flush();

      for (let i = 0; i < line.length; i += maxChars) {
        chunks.push(line.slice(i, i + maxChars));
      }

      continue;
    }

    const trial = [...currentLines, line];
    const trialStr = trial.join("\n");

    if (trialStr.length > maxChars && currentLines.length > 0) {
      flush();
      currentLines.push(line);
      continue;
    }

    currentLines.push(line);
  }

  flush();

  return chunks.length > 0 ? chunks : [body.slice(0, maxChars)];
}

function splitOversizedCategoryMarkdown(categoryMarkdown: string): string[] {
  if (categoryMarkdown.length <= DISCORD_COMPONENTS_V2_DISPLAYABLE_TEXT_MAX) {
    return [categoryMarkdown];
  }

  const lines = categoryMarkdown.split("\n");
  const headerLine = lines[0] ?? "";
  const body = lines.length > 1 ? lines.slice(1).join("\n") : "";
  const headerBlock = `${headerLine}\n\n`;
  const maxBodyPerMsg = DISCORD_COMPONENTS_V2_DISPLAYABLE_TEXT_MAX - headerBlock.length;

  if (maxBodyPerMsg < 200) {
    return chunkMarkdownPreservingLines(
      categoryMarkdown,
      DISCORD_COMPONENTS_V2_DISPLAYABLE_TEXT_MAX,
    );
  }

  const bodyChunks = chunkMarkdownPreservingLines(body, maxBodyPerMsg);

  return bodyChunks.map((chunk) => `${headerLine}\n\n${chunk}`);
}

function packTeamlistePanelMessages(title: string, categoryMarkdowns: readonly string[]): string[] {
  const messages: string[] = [];
  const batch: string[] = [];
  let batchLen = 0;
  const sep = "\n\n";

  const flush = (): void => {
    if (batch.length === 0) {
      return;
    }

    messages.push(batch.join(sep));
    batch.length = 0;
    batchLen = 0;
  };

  const appendSegment = (seg: string): void => {
    const added = batch.length === 0 ? seg.length : sep.length + seg.length;
    batch.push(seg);
    batchLen += added;
  };

  const segments: string[] = [title, ...categoryMarkdowns];

  for (const seg of segments) {
    if (seg.length > DISCORD_COMPONENTS_V2_DISPLAYABLE_TEXT_MAX) {
      flush();

      for (const piece of splitOversizedCategoryMarkdown(seg)) {
        messages.push(piece);
      }

      continue;
    }

    const addLen = batch.length === 0 ? seg.length : sep.length + seg.length;

    if (batchLen + addLen <= DISCORD_COMPONENTS_V2_DISPLAYABLE_TEXT_MAX) {
      appendSegment(seg);
    } else {
      flush();
      appendSegment(seg);
    }
  }

  flush();

  return messages;
}

function appendTeamlistePanelBanner(
  container: ContainerBuilder,
  kind: "continuation" | "final",
  multiPartPanel: boolean,
): void {
  const url =
    kind === "final" ? TEAM_LISTE_PANEL_BANNER_URL : TEAM_LISTE_PANEL_CONTINUATION_BANNER_URL;

  if (!multiPartPanel) {
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
  }

  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)),
  );
}

export function buildTeamlistePanelContainers(args: {
  guild: Guild;
  categories: TeamlisteCategoryRow[];
  robloxByDiscordUserId?: ReadonlyMap<string, RobloxLinkRow>;
}): ContainerBuilder[] {
  const robloxMap = args.robloxByDiscordUserId ?? new Map<string, RobloxLinkRow>();

  if (args.categories.length === 0) {
    const emptyMarkdown = `${TEAM_LISTE_TITLE}\n\n> ${emojiToString(EMOJIS.LINE)} *(Keine Kategorien konfiguriert.)*`;
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(emptyMarkdown),
    );
    appendTeamlistePanelBanner(container, "final", false);

    return [container];
  }

  const sections: string[] = [];

  for (const cat of args.categories) {
    sections.push(
      buildTeamlisteCategoryMarkdownBody({
        guild: args.guild,
        cat,
        robloxMap,
      }),
    );
  }

  const messageTexts = packTeamlistePanelMessages(TEAM_LISTE_TITLE, sections);
  const multiPartPanel = messageTexts.length > 1;
  const containers: ContainerBuilder[] = [];

  for (let mi = 0; mi < messageTexts.length; mi++) {
    const text = messageTexts[mi];
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(text),
    );
    appendTeamlistePanelBanner(
      container,
      mi === messageTexts.length - 1 ? "final" : "continuation",
      multiPartPanel,
    );
    containers.push(container);
  }

  return containers;
}

export function buildTeamlisteAdminContainer(categories: TeamlisteCategoryRow[]): ContainerBuilder {
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${emojiToString(EMOJIS.TEAM)} Teamliste verwalten`),
    new TextDisplayBuilder().setContent(
      `> Änderungen aktualisieren das öffentliche Teamliste-Panel. Pro Zeile: Kategorie bearbeiten oder löschen.`,
    ),
  );
  const displayed = categories.slice(0, TEAMLISTE_ADMIN_MAX_CATEGORIES);

  if (categories.length > TEAMLISTE_ADMIN_MAX_CATEGORIES) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> ${emojiToString(EMOJIS.LINE)} Es werden nur die ersten **${String(TEAMLISTE_ADMIN_MAX_CATEGORIES)}** Kategorien zum Bearbeiten angezeigt.`,
      ),
    );
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));

  if (displayed.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## *(Noch keine Kategorie)*`),
    );
  } else {
    for (let i = 0; i < displayed.length; i++) {
      const cat = displayed[i];
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${escapeMarkdown(cat.name)}`),
      );
      container.addActionRowComponents((row) =>
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(buildTeamlisteEditRowButtonCustomId(cat.id))
            .setLabel("Bearbeiten")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(buildTeamlisteDeleteRowButtonCustomId(cat.id))
            .setLabel("Löschen")
            .setStyle(ButtonStyle.Danger),
        ),
      );

      if (i < displayed.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
        );
      }
    }
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
  container.addActionRowComponents((row) =>
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(teamlisteBtnCreate)
        .setLabel("Kategorie erstellen")
        .setStyle(ButtonStyle.Success),
    ),
  );

  return container;
}

function categoryNameInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(teamlisteFieldName)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(80)
    .setRequired(true)
    .setPlaceholder("z. B. Highteam");
}

function rolesSelect(defaultRoleIds?: string[]): RoleSelectMenuBuilder {
  const b = new RoleSelectMenuBuilder()
    .setCustomId(teamlisteFieldRoles)
    .setMinValues(1)
    .setMaxValues(25);

  if (defaultRoleIds !== undefined && defaultRoleIds.length > 0) {
    b.addDefaultRoles(...defaultRoleIds.slice(0, 25));
  }

  return b;
}

export function buildTeamlisteCategoryCreateModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(teamlisteModalCreate)
    .setTitle("Kategorie erstellen")
    .addLabelComponents(
      new LabelBuilder().setLabel("Name").setTextInputComponent(categoryNameInput()),
      new LabelBuilder().setLabel("Rollen").setRoleSelectMenuComponent(rolesSelect()),
    );
}

export function buildTeamlisteCategoryEditModal(args: {
  category: TeamlisteCategoryRow;
}): ModalBuilder {
  const nameInput = categoryNameInput().setValue(args.category.name.slice(0, 80));

  return new ModalBuilder()
    .setCustomId(buildTeamlisteModalEditCustomId(args.category.id))
    .setTitle("Kategorie bearbeiten")
    .addLabelComponents(
      new LabelBuilder().setLabel("Name").setTextInputComponent(nameInput),
      new LabelBuilder()
        .setLabel("Rollen")
        .setRoleSelectMenuComponent(rolesSelect(args.category.roles)),
    );
}
