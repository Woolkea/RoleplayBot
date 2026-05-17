import {
  ButtonBuilder,
  ContainerBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ModalBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  UserSelectMenuBuilder,
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
  feedbackBtnOpen,
  feedbackFieldCategory,
  feedbackFieldReason,
  feedbackFieldStars,
  feedbackFieldUser,
  feedbackModalSubmit,
} from "@/interactions/custom-ids.js";

export const FEEDBACK_CATEGORY_VALUES = ["voice", "ticket", "ingame", "other"] as const;

export type FeedbackCategoryValue = (typeof FEEDBACK_CATEGORY_VALUES)[number];

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategoryValue, string> = {
  voice: "Voicesupport",
  ticket: "Ticket-Support",
  ingame: "Ingame-Support",
  other: "Weiteres",
};

export const FEEDBACK_STAR_OPTIONS = [
  { value: "5", label: "⭐⭐⭐⭐⭐ (5/5)" },
  { value: "4", label: "⭐⭐⭐⭐ (4/5)" },
  { value: "3", label: "⭐⭐⭐ (3/5)" },
  { value: "2", label: "⭐⭐ (2/5)" },
  { value: "1", label: "⭐ (1/5)" },
] as const;

export const FEEDBACK_BANNER_URL =
  "https://media.discordapp.net/attachments/1500208165307027587/1500837090668052640/LunarRP.png?ex=69fb3476&is=69f9e2f6&hm=dcaf2ed48037580b5127d01f270d96230866fe2f2cf9af0b46a56122cb077a55&=&format=webp&quality=lossless&width=1872&height=52";

export function feedbackV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

function categorySelectMenu(): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId(feedbackFieldCategory)
    .setMinValues(0)
    .setMaxValues(1)
    .setRequired(false)
    .addOptions(
      { label: FEEDBACK_CATEGORY_LABEL.voice, value: "voice" },
      { label: FEEDBACK_CATEGORY_LABEL.ticket, value: "ticket" },
      { label: FEEDBACK_CATEGORY_LABEL.ingame, value: "ingame" },
      { label: FEEDBACK_CATEGORY_LABEL.other, value: "other" },
    );
}

function starsSelectMenu(): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId(feedbackFieldStars)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(...FEEDBACK_STAR_OPTIONS.map((o) => ({ label: o.label, value: o.value })));
}

function reasonInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(feedbackFieldReason)
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setMaxLength(1000)
    .setRequired(true);
}

export function buildFeedbackPanelContainer(): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${emojiToString(EMOJIS.STERN)} Feedback geben`),
      new TextDisplayBuilder().setContent(
        `> Hier kannst du Feedback für unsere Teammitglieder hinterlassen.\n` +
          `> Nutze dazu einfach das Formular über den Button.`,
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
          .setCustomId(feedbackBtnOpen)
          .setLabel("Feedback geben")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.STERN_WHITE),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setSpacing(SeparatorSpacingSize.Large),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(FEEDBACK_BANNER_URL)),
    );
}

export function buildFeedbackModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(feedbackModalSubmit)
    .setTitle("Feedback geben")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Teammitglied")
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId(feedbackFieldUser)
            .setMinValues(1)
            .setMaxValues(1),
        ),
      new LabelBuilder().setLabel("Kategorie").setStringSelectMenuComponent(categorySelectMenu()),
      new LabelBuilder().setLabel("Sterne").setStringSelectMenuComponent(starsSelectMenu()),
      new LabelBuilder().setLabel("Grund").setTextInputComponent(reasonInput()),
    );
}

export function buildFeedbackLogContainer(args: {
  targetUserId: string;
  authorUserId: string;
  categoryLabel: string;
  starsLabel: string;
  reason: string;
}): ContainerBuilder {
  const reasonEsc = escapeMarkdown(args.reason.replaceAll("`", "'"));
  const catEsc = escapeMarkdown(args.categoryLabel);
  const starsEsc = escapeMarkdown(args.starsLabel);
  const body =
    `# ${emojiToString(EMOJIS.STERN)} Feedback für <@${args.targetUserId}>\n\n` +
    `> **Von:** <@${args.authorUserId}>\n` +
    `> **Kategorie:** ${catEsc}\n` +
    `> **Sterne:** ${starsEsc}\n` +
    `> **Grund:** \`${reasonEsc}\``;

  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(FEEDBACK_BANNER_URL)),
    );
}

export function buildFeedbackSuccessContainer(): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${emojiToString(EMOJIS.SUCCESS)} Feedback gesendet`),
  );
}

export function buildFeedbackLowStarsHintContainer(): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${emojiToString(EMOJIS.STERN)} Feedback notiert\n\n` +
        `> Bitte komme in den **Support-Warteraum**, **Büro Warrum** oder öffne ein **Ticket**.`,
    ),
  );
}

export function buildFeedbackStatsContainer(args: {
  targetUserId: string;
  totalCount: number;
  averageFormatted: string;
}): ContainerBuilder {
  const countLine =
    args.totalCount === 1
      ? "> **Insgesamt:** 1 Feedback"
      : `> **Insgesamt:** ${String(args.totalCount)} Feedbacks`;
  const body =
    `# ${emojiToString(EMOJIS.TEAM_XP_PANEL_STATS)} Feedback-Stats <@${args.targetUserId}>\n\n` +
    `${countLine}\n` +
    `> **Durchschnittliches Feedback:** ${args.averageFormatted}`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}

export function resolveFeedbackCategoryLabel(value: string | undefined): string {
  if (value === undefined || value === "") {
    return FEEDBACK_CATEGORY_LABEL.other;
  }

  if (value === "voice" || value === "ticket" || value === "ingame" || value === "other") {
    return FEEDBACK_CATEGORY_LABEL[value];
  }

  return FEEDBACK_CATEGORY_LABEL.other;
}

export function resolveFeedbackStarsLabel(starValue: string): string {
  const opt = FEEDBACK_STAR_OPTIONS.find((o) => o.value === starValue);

  return opt !== undefined ? opt.label : starValue;
}
