import { and, asc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import {
  dizzyAbuseModeratorThresholdClock,
  dizzyAbusePenalties,
  dizzyControlReports,
  dizzyControls,
} from "@/db/schema.js";

import {
  abuseThresholdsMet,
  effectiveWindowStart,
  resolveAbuseTriggerReason,
  rollingSevenDaysStart,
  utcDayStart,
} from "@/services/team-xp/dizzy-abuse-thresholds.js";

import { getTeamXpRow, incrementTeamXp, updateTeamXpAbsolute } from "@/repositories/team-xp.js";

export type SubmitDizzyReportResult =
  | {
      outcome: "not_found";
    }
  | {
      outcome: "self_report";
    }
  | {
      outcome: "duplicate";
    }
  | {
      outcome: "recorded";
    }
  | {
      outcome: "penalized";
      penaltyId: number;
      guildId: string;
      moderatorUserId: string;
      xpBefore: number;
      xpAfter: number;
      triggerReason: "daily_3" | "weekly_11" | "daily_3_and_weekly_11";
      reporterUserIds: string[];
    };

export async function getDizzyControlByMessageId(messageId: string): Promise<{
  guildId: string;
  targetUserId: string;
  moderatorDiscordUserId: string;
} | null> {
  const db = getDb();
  const rows = await db
    .select({
      guildId: dizzyControls.guildId,
      targetUserId: dizzyControls.targetUserId,
      moderatorDiscordUserId: dizzyControls.moderatorDiscordUserId,
    })
    .from(dizzyControls)
    .where(eq(dizzyControls.messageId, messageId))
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  return row;
}

export async function submitDizzyControlReport(args: {
  dizzyControlMessageId: string;
  reporterDiscordUserId: string;
  now: Date;
}): Promise<SubmitDizzyReportResult> {
  return getDb().transaction(async (tx) => {
    const dcRows = await tx
      .select({
        guildId: dizzyControls.guildId,
        moderatorDiscordUserId: dizzyControls.moderatorDiscordUserId,
      })
      .from(dizzyControls)
      .where(eq(dizzyControls.messageId, args.dizzyControlMessageId))
      .limit(1);
    const dc = dcRows.at(0);

    if (dc === undefined) {
      return { outcome: "not_found" };
    }

    if (dc.moderatorDiscordUserId === args.reporterDiscordUserId) {
      return { outcome: "self_report" };
    }

    const inserted = await tx
      .insert(dizzyControlReports)
      .values({
        guildId: dc.guildId,
        dizzyControlMessageId: args.dizzyControlMessageId,
        reporterDiscordUserId: args.reporterDiscordUserId,
      })
      .onConflictDoNothing()
      .returning({ id: dizzyControlReports.id });

    if (inserted.length === 0) {
      return { outcome: "duplicate" };
    }

    await tx
      .insert(dizzyAbuseModeratorThresholdClock)
      .values({
        guildId: dc.guildId,
        moderatorUserId: dc.moderatorDiscordUserId,
        countReportsAfter: new Date(0),
      })
      .onConflictDoNothing();
    const clockRows = await tx
      .select({ countReportsAfter: dizzyAbuseModeratorThresholdClock.countReportsAfter })
      .from(dizzyAbuseModeratorThresholdClock)
      .where(
        and(
          eq(dizzyAbuseModeratorThresholdClock.guildId, dc.guildId),
          eq(dizzyAbuseModeratorThresholdClock.moderatorUserId, dc.moderatorDiscordUserId),
        ),
      )
      .limit(1);
    const clockVal = clockRows.at(0)?.countReportsAfter ?? new Date(0);
    const dayLower = effectiveWindowStart(clockVal, utcDayStart(args.now));
    const weekLower = effectiveWindowStart(clockVal, rollingSevenDaysStart(args.now));
    const dayCountRows = await tx
      .select({ c: sql<number>`count(*)::int` })
      .from(dizzyControlReports)
      .innerJoin(
        dizzyControls,
        eq(dizzyControlReports.dizzyControlMessageId, dizzyControls.messageId),
      )
      .where(
        and(
          eq(dizzyControls.guildId, dc.guildId),
          eq(dizzyControls.moderatorDiscordUserId, dc.moderatorDiscordUserId),
          gte(dizzyControlReports.createdAt, dayLower),
        ),
      );
    const weekCountRows = await tx
      .select({ c: sql<number>`count(*)::int` })
      .from(dizzyControlReports)
      .innerJoin(
        dizzyControls,
        eq(dizzyControlReports.dizzyControlMessageId, dizzyControls.messageId),
      )
      .where(
        and(
          eq(dizzyControls.guildId, dc.guildId),
          eq(dizzyControls.moderatorDiscordUserId, dc.moderatorDiscordUserId),
          gte(dizzyControlReports.createdAt, weekLower),
        ),
      );
    const dayCount = dayCountRows.at(0)?.c ?? 0;
    const weekCount = weekCountRows.at(0)?.c ?? 0;

    if (!abuseThresholdsMet(dayCount, weekCount)) {
      return { outcome: "recorded" };
    }

    const xpRow = await getTeamXpRow(
      { guildId: dc.guildId, userId: dc.moderatorDiscordUserId },
      tx,
    );
    const xpBefore = xpRow?.xp ?? 0;
    let xpAfter: number;

    if (xpBefore >= 1) {
      xpAfter = Math.floor(xpBefore / 2);
      await updateTeamXpAbsolute(
        { guildId: dc.guildId, userId: dc.moderatorDiscordUserId, xp: xpAfter },
        tx,
      );
    } else {
      await incrementTeamXp(
        { guildId: dc.guildId, userId: dc.moderatorDiscordUserId, delta: -250 },
        tx,
      );
      const afterRow = await getTeamXpRow(
        { guildId: dc.guildId, userId: dc.moderatorDiscordUserId },
        tx,
      );
      xpAfter = afterRow?.xp ?? -250;
    }

    const reporterIdRows = await tx
      .selectDistinct({ uid: dizzyControlReports.reporterDiscordUserId })
      .from(dizzyControlReports)
      .innerJoin(
        dizzyControls,
        eq(dizzyControlReports.dizzyControlMessageId, dizzyControls.messageId),
      )
      .where(
        and(
          eq(dizzyControls.guildId, dc.guildId),
          eq(dizzyControls.moderatorDiscordUserId, dc.moderatorDiscordUserId),
          gte(dizzyControlReports.createdAt, clockVal),
        ),
      )
      .orderBy(asc(dizzyControlReports.reporterDiscordUserId));
    const reporterUserIds = reporterIdRows.map((r) => r.uid).sort();
    const triggerReason = resolveAbuseTriggerReason(dayCount, weekCount);
    await tx
      .insert(dizzyAbuseModeratorThresholdClock)
      .values({
        guildId: dc.guildId,
        moderatorUserId: dc.moderatorDiscordUserId,
        countReportsAfter: args.now,
      })
      .onConflictDoUpdate({
        target: [
          dizzyAbuseModeratorThresholdClock.guildId,
          dizzyAbuseModeratorThresholdClock.moderatorUserId,
        ],
        set: { countReportsAfter: args.now },
      });
    const penRows = await tx
      .insert(dizzyAbusePenalties)
      .values({
        guildId: dc.guildId,
        moderatorUserId: dc.moderatorDiscordUserId,
        xpBefore,
        xpAfter,
        triggerReason,
        reporterUserIds,
      })
      .returning({ id: dizzyAbusePenalties.id });
    const penaltyId = penRows.at(0)?.id;

    if (penaltyId === undefined) {
      throw new Error("submitDizzyControlReport: penalty insert returned no id");
    }

    return {
      outcome: "penalized",
      penaltyId,
      guildId: dc.guildId,
      moderatorUserId: dc.moderatorDiscordUserId,
      xpBefore,
      xpAfter,
      triggerReason,
      reporterUserIds,
    };
  });
}

export async function updateDizzyAbusePenaltyAnnouncement(args: {
  penaltyId: number;
  announcementChannelId: string;
  announcementMessageId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .update(dizzyAbusePenalties)
    .set({
      announcementChannelId: args.announcementChannelId,
      announcementMessageId: args.announcementMessageId,
    })
    .where(eq(dizzyAbusePenalties.id, args.penaltyId));
}

export type DizzyAbusePenaltyRow = {
  id: number;
  guildId: string;
  moderatorUserId: string;
  xpBefore: number;
  xpAfter: number;
  triggerReason: string;
  reporterUserIds: string[];
  announcementChannelId: string | null;
  announcementMessageId: string | null;
  revertedAt: Date | null;
};

export async function getDizzyAbusePenaltyById(
  penaltyId: number,
): Promise<DizzyAbusePenaltyRow | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: dizzyAbusePenalties.id,
      guildId: dizzyAbusePenalties.guildId,
      moderatorUserId: dizzyAbusePenalties.moderatorUserId,
      xpBefore: dizzyAbusePenalties.xpBefore,
      xpAfter: dizzyAbusePenalties.xpAfter,
      triggerReason: dizzyAbusePenalties.triggerReason,
      reporterUserIds: dizzyAbusePenalties.reporterUserIds,
      announcementChannelId: dizzyAbusePenalties.announcementChannelId,
      announcementMessageId: dizzyAbusePenalties.announcementMessageId,
      revertedAt: dizzyAbusePenalties.revertedAt,
    })
    .from(dizzyAbusePenalties)
    .where(eq(dizzyAbusePenalties.id, penaltyId))
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  return row;
}

export type RevertDizzyAbusePenaltyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "not_found" | "already_reverted";
    };

export async function revertDizzyAbusePenalty(args: {
  penaltyId: number;
  revertedByDiscordUserId: string;
  now: Date;
}): Promise<RevertDizzyAbusePenaltyResult> {
  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select({
        id: dizzyAbusePenalties.id,
        guildId: dizzyAbusePenalties.guildId,
        moderatorUserId: dizzyAbusePenalties.moderatorUserId,
        xpBefore: dizzyAbusePenalties.xpBefore,
        revertedAt: dizzyAbusePenalties.revertedAt,
      })
      .from(dizzyAbusePenalties)
      .where(eq(dizzyAbusePenalties.id, args.penaltyId))
      .limit(1);
    const pen = rows.at(0);

    if (pen === undefined) {
      return { ok: false, reason: "not_found" };
    }

    if (pen.revertedAt !== null) {
      return { ok: false, reason: "already_reverted" };
    }

    await updateTeamXpAbsolute(
      {
        guildId: pen.guildId,
        userId: pen.moderatorUserId,
        xp: pen.xpBefore,
      },
      tx,
    );
    await tx
      .insert(dizzyAbuseModeratorThresholdClock)
      .values({
        guildId: pen.guildId,
        moderatorUserId: pen.moderatorUserId,
        countReportsAfter: args.now,
      })
      .onConflictDoUpdate({
        target: [
          dizzyAbuseModeratorThresholdClock.guildId,
          dizzyAbuseModeratorThresholdClock.moderatorUserId,
        ],
        set: { countReportsAfter: args.now },
      });
    await tx
      .update(dizzyAbusePenalties)
      .set({
        revertedAt: args.now,
        revertedByDiscordUserId: args.revertedByDiscordUserId,
      })
      .where(eq(dizzyAbusePenalties.id, args.penaltyId));

    return { ok: true };
  });
}
