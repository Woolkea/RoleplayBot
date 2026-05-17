import type { AppEnv } from "@/config/env.js";

import type { Guild, GuildMember, User } from "discord.js";

import { getFeedbackTargetStats } from "@/repositories/feedback-entries.js";

import { memberHasRoleId, memberHasTeamRole } from "@/services/team-xp/permissions.js";

import { FeedbackUserFacingError } from "./feedback-user-error.js";

export function formatFeedbackAverageStarsDe(avgStars: number | null, count: number): string {
  if (count === 0 || avgStars === null) {
    return "—";
  }

  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(avgStars);
}

export async function prepareFeedbackStatsTarget(args: {
  guild: Guild;
  actorMember: GuildMember;
  actorUserId: string;
  requestedUser: User | null;
  env: AppEnv;
}): Promise<string> {
  const teamRoleId = args.env.teamRoleId?.trim();

  if (teamRoleId === undefined || teamRoleId === "") {
    throw new FeedbackUserFacingError(
      "Team-Rolle fehlt in der Konfiguration (`TEAM_ROLE_ID`). Feedback-Stats sind nicht verfügbar.",
    );
  }

  if (!memberHasTeamRole(args.actorMember, teamRoleId)) {
    throw new FeedbackUserFacingError("Nur Teammitglieder können Feedback-Stats einsehen.");
  }

  const requested = args.requestedUser;
  const selfId = args.actorUserId;

  if (requested === null || requested.id === selfId) {
    return selfId;
  }

  const modRoleId = args.env.teamStatusModRoleId?.trim();

  if (modRoleId === undefined || modRoleId === "") {
    throw new FeedbackUserFacingError(
      "Fremde Feedback-Stats sind hier nicht freigeschaltet (`TEAM_STATUS_MOD_ROLE_ID`).",
    );
  }

  if (!memberHasRoleId(args.actorMember, modRoleId)) {
    throw new FeedbackUserFacingError("Du darfst nur deine eigenen Feedback-Stats einsehen.");
  }

  if (requested.bot) {
    throw new FeedbackUserFacingError("Bei Bots geht das nicht.");
  }

  const targetMember = await args.guild.members.fetch(requested.id).catch(() => null);

  if (targetMember === null) {
    throw new FeedbackUserFacingError("Mitglied nicht in dieser Guild gefunden.");
  }

  if (!memberHasTeamRole(targetMember, teamRoleId)) {
    throw new FeedbackUserFacingError("Feedback-Stats gibt es nur für Teammitglieder.");
  }

  return requested.id;
}

export async function loadFeedbackStatsForTarget(args: {
  guildId: string;
  targetUserId: string;
}): Promise<{
  count: number;
  avgStars: number | null;
  averageFormatted: string;
}> {
  const { count, avgStars } = await getFeedbackTargetStats({
    guildId: args.guildId,
    targetUserId: args.targetUserId,
  });

  return {
    count,
    avgStars,
    averageFormatted: formatFeedbackAverageStarsDe(avgStars, count),
  };
}
