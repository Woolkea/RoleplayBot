import {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";

import { MessageFlags, SeparatorSpacingSize } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { regelwerkSelectCategory } from "@/interactions/custom-ids.js";

import { chunkRegelwerkDetailText, formatRegelwerkBody } from "./format-regelwerk.js";

import type { RegelwerkCategoryKey } from "./regelwerk-content.js";

import { REGELWERK_DATA } from "./regelwerk-content.js";

export const REGELWERK_SAFEZONES_MAP_URL =
  "https://media.discordapp.net/attachments/1371110175448240251/1503073633021726811/Neuigkeiten.webp?ex=6a0205e7&is=6a00b467&hm=f80e4c355b71f1e1664e1eb698feb522faabe06b7307a97db5ea6d37c16c76a6&=&format=webp&width=1240&height=705";

export const REGELWERK_FOOTER_BANNER_URL =
  "https://media.discordapp.net/attachments/1500208165307027587/1500837090668052640/LunarRP.png?ex=69fd2eb6&is=69fbdd36&hm=c1c20c0b80c4cf086cdd7bc97b5a3793b422b57719eccae8516138381fdee68b&=&format=webp&quality=lossless&width=1872&height=52";

export const REGELWERK_RP_FIRST_PAGE_IMAGE_URL =
  "https://cdn.discordapp.com/attachments/1371110175448240251/1501712925918756914/GAA.png?ex=69fdbb66&is=69fc69e6&hm=7400cddd3a49d7705d4301aaa273e82613749551b6c9214d144c386a02132e0d";
const RP_SECTION_3_MARKER = "\n\n## §3. Jobs & Kriminalität";

function appendRegelwerkFooterBanner(container: ContainerBuilder): ContainerBuilder {
  return container
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setSpacing(SeparatorSpacingSize.Large),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(REGELWERK_FOOTER_BANNER_URL),
      ),
    );
}

export function regelwerkV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export function regelwerkEphemeralV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export function regelwerkDetailFollowUpFlags(): number {
  return MessageFlags.Ephemeral | MessageFlags.IsComponentsV2;
}

function emojiForCategory(key: RegelwerkCategoryKey): {
  id: string;
  name: string;
} {
  switch (key) {
    case "rp":
      return EMOJIS.REGELWERK_INGAME;
    case "discord":
      return EMOJIS.REGELWERK_DISCORD;
    case "stvo":
      return EMOJIS.REGELWERK_AUTO;
  }
}

export function buildRegelwerkPanelContainer(): ContainerBuilder {
  return appendRegelwerkFooterBanner(
    new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.REGELWERK_HEADER)} Regelwerk`,
        ),
      )
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(REGELWERK_SAFEZONES_MAP_URL),
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Large)
          .setSpacing(SeparatorSpacingSize.Large),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "**Wähle ein Regelwerk aus, um den Inhalt anzuzeigen.**",
        ),
      )
      .addActionRowComponents((row) =>
        row.addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(regelwerkSelectCategory)
            .setPlaceholder("Regelwerk wählen")
            .addOptions(
              {
                label: "Discord Regelwerk",
                value: "discord",
                emoji: EMOJIS.REGELWERK_DISCORD,
              },
              {
                label: "Ingame Regelwerk",
                value: "rp",
                emoji: EMOJIS.REGELWERK_INGAME,
              },
              {
                label: "STVO Regelwerk",
                value: "stvo",
                emoji: EMOJIS.REGELWERK_AUTO,
              },
            ),
        ),
      ),
  );
}

export type RegelwerkDetailPageSpec = {
  text: string;
  includeLunarFooter: boolean;
  includeGaaImage: boolean;
};

function buildRegelwerkFullMarkdown(key: RegelwerkCategoryKey): string {
  const category = REGELWERK_DATA[key];
  const emoji = emojiForCategory(key);
  const headerBlock = `# ${emojiToString(emoji)} ${category.title}\n\n` + category.description;
  const body = formatRegelwerkBody(category.content);

  return `${headerBlock}\n\n${body}`;
}

export function buildRegelwerkDetailPages(key: RegelwerkCategoryKey): RegelwerkDetailPageSpec[] {
  const fullText = buildRegelwerkFullMarkdown(key);

  if (key === "rp") {
    const idx = fullText.indexOf(RP_SECTION_3_MARKER);

    if (idx !== -1) {
      const before = fullText.slice(0, idx).trimEnd();
      const after = fullText.slice(idx).trimStart();
      const chunksBefore = chunkRegelwerkDetailText(before);
      const chunksAfter = chunkRegelwerkDetailText(after);
      const pages: RegelwerkDetailPageSpec[] = [];

      for (let i = 0; i < chunksBefore.length; i++) {
        pages.push({
          text: chunksBefore[i],
          includeLunarFooter: false,
          includeGaaImage: i === 0,
        });
      }

      for (const text of chunksAfter) {
        pages.push({ text, includeLunarFooter: true, includeGaaImage: false });
      }

      return pages;
    }
  }

  const chunks = chunkRegelwerkDetailText(fullText);

  return chunks.map((text) => ({
    text,
    includeLunarFooter: true,
    includeGaaImage: false,
  }));
}

export function buildRegelwerkDetailPageContainer(spec: RegelwerkDetailPageSpec): ContainerBuilder {
  let container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(spec.text),
  );

  if (spec.includeGaaImage) {
    container = container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(REGELWERK_RP_FIRST_PAGE_IMAGE_URL),
      ),
    );
  }

  if (spec.includeLunarFooter) {
    container = appendRegelwerkFooterBanner(container);
  }

  return container;
}
