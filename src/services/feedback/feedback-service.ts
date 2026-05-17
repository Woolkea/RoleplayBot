import { ChannelType } from "discord.js";

import type { Client } from "discord.js";

import { loadEnv } from "@/config/env.js";

import {
  getLastFeedbackEntryByAuthor,
  insertFeedbackEntry,
} from "@/repositories/feedback-entries.js";

import { memberHasTeamRole } from "@/services/team-xp/permissions.js";

import { FeedbackUserFacingError } from "./feedback-user-error.js";

import { buildFeedbackLogContainer, feedbackV2Flags } from "./ui-builders.js";

const FEEDBACK_COOLDOWN_MS = 10 * 60 * 1000;

export const feedbackService = {
  async submitFeedback(args: {
    client: Client;
    guildId: string;
    authorUserId: string;
    targetUserId: string;
    categoryLabel: string;
    starsLabel: string;
    reason: string;
  }): Promise<void> {
    if (args.authorUserId === args.targetUserId) {
      throw new FeedbackUserFacingError("Du kannst dir nicht selbst Feedback geben.");
    }

    const lastEntry = await getLastFeedbackEntryByAuthor({
      guildId: args.guildId,
      authorUserId: args.authorUserId,
    });

    if (lastEntry) {
      const now = Date.now();
      const last = lastEntry.createdAt.getTime();

      if (now - last < FEEDBACK_COOLDOWN_MS) {
        throw new FeedbackUserFacingError(
          "Du hast gerade erst eins abgesendet. Bitte warte, bevor du wieder eins absetzt.",
        );
      }
    }

    const env = loadEnv();
    const teamRoleId = env.teamRoleId?.trim();

    if (teamRoleId === undefined || teamRoleId === "") {
      throw new FeedbackUserFacingError(
        "Team-Rolle fehlt in der Konfiguration (TEAM_ROLE_ID). Feedback kann nicht geprüft werden.",
      );
    }

    const guild = await args.client.guilds.fetch(args.guildId);
    const targetMember = await guild.members.fetch(args.targetUserId).catch(() => null);

    if (targetMember === null) {
      throw new FeedbackUserFacingError(
        "Der ausgewählte Nutzer wurde nicht gefunden oder ist kein Mitglied dieses Servers.",
      );
    }

    if (!memberHasTeamRole(targetMember, teamRoleId)) {
      throw new FeedbackUserFacingError(
        "Feedback kann nur für Mitglieder mit der konfigurierten Team-Rolle vergeben werden.",
      );
    }

    const channelId = env.feedbackChannelId;

    if (channelId === undefined) {
      throw new FeedbackUserFacingError("Feedback-Kanal fehlt in .env (FEEDBACK_CHANNEL_ID).");
    }

    const ch = await args.client.channels.fetch(channelId);

    if (ch === null || ch.type !== ChannelType.GuildText) {
      throw new FeedbackUserFacingError("Feedback-Kanal nicht gefunden oder kein Textkanal.");
    }

    const logContainer = buildFeedbackLogContainer({
      targetUserId: args.targetUserId,
      authorUserId: args.authorUserId,
      categoryLabel: args.categoryLabel,
      starsLabel: args.starsLabel,
      reason: args.reason,
    });
    const message = await ch.send({
      flags: feedbackV2Flags(),
      components: [logContainer],
    });

    try {
      await insertFeedbackEntry({
        guildId: args.guildId,
        authorDiscordUserId: args.authorUserId,
        targetDiscordUserId: args.targetUserId,
        category: args.categoryLabel,
        stars: args.starsLabel,
        reason: args.reason,
        messageUrl: message.url,
      });
    } catch (err) {
      await message.delete().catch(() => undefined);
      throw err;
    }
  },
};
