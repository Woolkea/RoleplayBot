import {
  ContainerBuilder,
  LabelBuilder,
  ModalBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
} from "@discordjs/builders";

import { TextInputStyle } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import {
  buildTeamTxtStatusModalSubmitCustomId,
  teamTxtStatusFieldDescription,
} from "@/interactions/custom-ids.js";

import type { MyTeamTextStatusPayload } from "./team-member-text-status-service.js";

const MAX_DESC = 4000;

function escapeCodeFenceBody(text: string): string {
  return text.replaceAll("```", "``\u200b`");
}

export function buildTeamTextStatusModal(args: { targetUserId: string }): ModalBuilder {
  const descriptionInput = new TextInputBuilder()
    .setCustomId(teamTxtStatusFieldDescription)
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setMaxLength(MAX_DESC)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(buildTeamTxtStatusModalSubmitCustomId(args.targetUserId))
    .setTitle("Status schreiben")
    .addLabelComponents(
      new LabelBuilder().setLabel("Beschreibung").setTextInputComponent(descriptionInput),
    );
}

export function buildMyTeamTextStatusContainer(payload: MyTeamTextStatusPayload): ContainerBuilder {
  const line = emojiToString(EMOJIS.LINE);
  const isSelf = payload.subjectUserId === undefined;

  if (isSelf) {
    const header = `# ${emojiToString(EMOJIS.COMMENT_WHITE)} Mein Status`;

    if (!payload.hasStatus || payload.description === undefined) {
      const emptyLine = `${line} Du hast noch keinen Status.`;
      const body = [header, "", emptyLine].join("\n");

      return new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(body),
      );
    }

    const setBy = payload.setByDiscordUserId ?? "";
    const unix = payload.updatedAtUnix ?? 0;
    const metaLine = `${line} Gesetzt von <@${setBy}> — <t:${String(unix)}:R>`;
    const safeDesc = escapeCodeFenceBody(payload.description);
    const codeBlock = `\`\`\`\n${safeDesc}\n\`\`\``;
    const parts = [header, "", metaLine, "", codeBlock];

    if (payload.previousSetByDiscordUserId !== undefined) {
      parts.push(
        "",
        `${line} Dieser Status hat einen früheren Eintrag überschrieben (zuletzt von <@${payload.previousSetByDiscordUserId}>).`,
      );
    }

    return new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(parts.join("\n")),
    );
  }

  const subjectUserId = payload.subjectUserId;

  if (subjectUserId === undefined) {
    return new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Fehler\n> Kein Zielnutzer für diesen Status."),
    );
  }

  const header = `# ${emojiToString(EMOJIS.COMMENT_WHITE)} Status\n> <@${subjectUserId}>`;

  if (!payload.hasStatus || payload.description === undefined) {
    const emptyLine = `${line} Für <@${subjectUserId}> ist kein Status gespeichert.`;
    const body = [header, "", emptyLine].join("\n");

    return new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(body),
    );
  }

  const setBy = payload.setByDiscordUserId ?? "";
  const unix = payload.updatedAtUnix ?? 0;
  const metaLine = `${line} Gesetzt von <@${setBy}> — <t:${String(unix)}:R>`;
  const safeDesc = escapeCodeFenceBody(payload.description);
  const codeBlock = `\`\`\`\n${safeDesc}\n\`\`\``;
  const parts = [header, "", metaLine, "", codeBlock];

  if (payload.previousSetByDiscordUserId !== undefined) {
    parts.push(
      "",
      `${line} Dieser Status hat einen früheren Eintrag überschrieben (zuletzt von <@${payload.previousSetByDiscordUserId}>).`,
    );
  }

  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(parts.join("\n")),
  );
}

export function buildTeamTextStatusSuccessContainer(args: {
  targetUserId: string;
}): ContainerBuilder {
  const body =
    `# ${emojiToString(EMOJIS.SUCCESS)} Gespeichert\n` + `> Für <@${args.targetUserId}>.`;

  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}
