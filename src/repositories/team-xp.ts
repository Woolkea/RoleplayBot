import { and, desc, eq, gt, gte, isNotNull, isNull, lte, lt, sql } from "drizzle-orm";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { getDb } from "@/db/client.js";

import type * as schema from "@/db/schema.js";

import { dizzyControls, globalXpBoosts, teamXp, teamXpHistory } from "@/db/schema.js";

export type TeamXpDbExecutor = NodePgDatabase<typeof schema>;

export async function incrementTeamXp(
  args: {
    guildId: string;
    userId: string;
    delta: number;
  },
  db: TeamXpDbExecutor = getDb(),
): Promise<void> {
  const { guildId, userId, delta } = args;

  if (delta === 0) {
    return;
  }

  const rows = await db
    .insert(teamXp)
    .values({ guildId, userId, xp: delta })
    .onConflictDoUpdate({
      target: [teamXp.guildId, teamXp.userId],
      set: {
        xp: sql`${teamXp.xp} + ${delta}`,
      },
    })
    .returning({ xp: teamXp.xp });

  if (rows.length > 0) {
    const newXp = rows[0].xp;
    await db.insert(teamXpHistory).values({
      guildId,
      userId,
      xp: newXp,
    });
    const avgXp = await getAverageTeamXp(guildId, db);
    await db.insert(teamXpHistory).values({
      guildId,
      userId: "AVERAGE",
      xp: avgXp,
    });
  }
}

export async function setTeamMemberLastMessageAt(args: {
  guildId: string;
  userId: string;
  at: Date;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(teamXp)
    .values({
      guildId: args.guildId,
      userId: args.userId,
      xp: 0,
      lastMessageAt: args.at,
    })
    .onConflictDoUpdate({
      target: [teamXp.guildId, teamXp.userId],
      set: {
        lastMessageAt: args.at,
      },
    });
}

export async function getTeamXpRow(
  args: {
    guildId: string;
    userId: string;
  },
  db: TeamXpDbExecutor = getDb(),
): Promise<
  | {
      xp: number;
      lastMessageAt: Date | null;
    }
  | undefined
> {
  const rows = await db
    .select({
      xp: teamXp.xp,
      lastMessageAt: teamXp.lastMessageAt,
    })
    .from(teamXp)
    .where(and(eq(teamXp.guildId, args.guildId), eq(teamXp.userId, args.userId)))
    .limit(1);

  return rows[0];
}

export async function listTeamXpLeaderboard(args: {
  guildId: string;
  limit: number;
  offset: number;
}): Promise<
  Array<{
    userId: string;
    xp: number;
  }>
> {
  const db = getDb();

  return db
    .select({
      userId: teamXp.userId,
      xp: teamXp.xp,
    })
    .from(teamXp)
    .where(eq(teamXp.guildId, args.guildId))
    .orderBy(desc(teamXp.xp), desc(teamXp.userId))
    .limit(args.limit)
    .offset(args.offset);
}

export async function countTeamXpRows(guildId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(teamXp)
    .where(eq(teamXp.guildId, guildId));
  const n = rows[0]?.c;

  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function getAverageTeamXp(
  guildId: string,
  db: TeamXpDbExecutor = getDb(),
): Promise<number> {
  const rows = await db
    .select({ avg: sql<number | null>`avg(${teamXp.xp})` })
    .from(teamXp)
    .where(and(eq(teamXp.guildId, guildId), gt(teamXp.xp, 0)));
  const n = rows[0]?.avg;

  return typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 0;
}

export async function deleteAllTeamXpForGuild(guildId: string): Promise<void> {
  const db = getDb();
  await db.delete(teamXp).where(eq(teamXp.guildId, guildId));
}

export async function insertDizzyControl(row: {
  messageId: string;
  guildId: string;
  targetUserId: string;
  moderatorDiscordUserId: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(dizzyControls).values({
    messageId: row.messageId,
    guildId: row.guildId,
    targetUserId: row.targetUserId,
    moderatorDiscordUserId: row.moderatorDiscordUserId,
  });
}

export async function dizzyControlExists(messageId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ messageId: dizzyControls.messageId })
    .from(dizzyControls)
    .where(eq(dizzyControls.messageId, messageId))
    .limit(1);

  return rows.length > 0;
}

export async function getLatestDizzyControlForTarget(args: {
  guildId: string;
  targetUserId: string;
}): Promise<{
  createdAt: Date;
  moderatorDiscordUserId: string;
} | null> {
  const db = getDb();
  const rows = await db
    .select({
      createdAt: dizzyControls.createdAt,
      moderatorDiscordUserId: dizzyControls.moderatorDiscordUserId,
    })
    .from(dizzyControls)
    .where(
      and(
        eq(dizzyControls.guildId, args.guildId),
        eq(dizzyControls.targetUserId, args.targetUserId),
      ),
    )
    .orderBy(desc(dizzyControls.createdAt))
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  return { createdAt: row.createdAt, moderatorDiscordUserId: row.moderatorDiscordUserId };
}

export async function insertGlobalXpBoost(row: {
  guildId: string;
  multiplier: number;
  expiresAt: Date;
  setByDiscordUserId: string;
  bonusPercent: number;
  durationHours: number;
  reason: string;
}): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(globalXpBoosts)
    .values({
      guildId: row.guildId,
      multiplier: row.multiplier,
      expiresAt: row.expiresAt,
      setByDiscordUserId: row.setByDiscordUserId,
      bonusPercent: row.bonusPercent,
      durationHours: row.durationHours,
      reason: row.reason,
    })
    .returning({ id: globalXpBoosts.id });

  if (rows.length === 0) {
    throw new Error("insertGlobalXpBoost: empty returning");
  }

  return rows[0].id;
}

export async function deleteGlobalXpBoostById(id: number): Promise<void> {
  const db = getDb();
  await db.delete(globalXpBoosts).where(eq(globalXpBoosts.id, id));
}

export async function updateGlobalXpBoostAnnouncementIds(args: {
  id: number;
  announcementChannelId: string;
  announcementMessageId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .update(globalXpBoosts)
    .set({
      announcementChannelId: args.announcementChannelId,
      announcementMessageId: args.announcementMessageId,
    })
    .where(eq(globalXpBoosts.id, args.id));
}

export type GlobalXpBoostAnnouncementRow = {
  id: number;
  guildId: string;
  announcementChannelId: string;
  announcementMessageId: string;
  bonusPercent: number;
  durationHours: number;
  reason: string;
  setByDiscordUserId: string;
};

export async function listActiveGlobalXpBoostsWithAnnouncements(args: {
  guildId: string;
  now: Date;
}): Promise<GlobalXpBoostAnnouncementRow[]> {
  const db = getDb();
  const raw = await db
    .select({
      id: globalXpBoosts.id,
      guildId: globalXpBoosts.guildId,
      announcementChannelId: globalXpBoosts.announcementChannelId,
      announcementMessageId: globalXpBoosts.announcementMessageId,
      bonusPercent: globalXpBoosts.bonusPercent,
      durationHours: globalXpBoosts.durationHours,
      reason: globalXpBoosts.reason,
      setByDiscordUserId: globalXpBoosts.setByDiscordUserId,
    })
    .from(globalXpBoosts)
    .where(
      and(
        eq(globalXpBoosts.guildId, args.guildId),
        gt(globalXpBoosts.expiresAt, args.now),
        isNotNull(globalXpBoosts.announcementChannelId),
        isNotNull(globalXpBoosts.announcementMessageId),
      ),
    );

  return raw
    .filter(
      (
        r,
      ): r is typeof r & {
        announcementChannelId: string;
        announcementMessageId: string;
      } => r.announcementChannelId !== null && r.announcementMessageId !== null,
    )
    .map((r) => ({
      id: r.id,
      guildId: r.guildId,
      announcementChannelId: r.announcementChannelId,
      announcementMessageId: r.announcementMessageId,
      bonusPercent: r.bonusPercent,
      durationHours: r.durationHours,
      reason: r.reason,
      setByDiscordUserId: r.setByDiscordUserId,
    }));
}

export async function listGlobalXpBoostsNeedingExpiryReply(args: {
  guildId: string;
  now: Date;
}): Promise<GlobalXpBoostAnnouncementRow[]> {
  const db = getDb();
  const raw = await db
    .select({
      id: globalXpBoosts.id,
      guildId: globalXpBoosts.guildId,
      announcementChannelId: globalXpBoosts.announcementChannelId,
      announcementMessageId: globalXpBoosts.announcementMessageId,
      bonusPercent: globalXpBoosts.bonusPercent,
      durationHours: globalXpBoosts.durationHours,
      reason: globalXpBoosts.reason,
      setByDiscordUserId: globalXpBoosts.setByDiscordUserId,
    })
    .from(globalXpBoosts)
    .where(
      and(
        eq(globalXpBoosts.guildId, args.guildId),
        lte(globalXpBoosts.expiresAt, args.now),
        isNotNull(globalXpBoosts.announcementChannelId),
        isNotNull(globalXpBoosts.announcementMessageId),
        isNull(globalXpBoosts.expiryReplySentAt),
      ),
    );

  return raw
    .filter(
      (
        r,
      ): r is typeof r & {
        announcementChannelId: string;
        announcementMessageId: string;
      } => r.announcementChannelId !== null && r.announcementMessageId !== null,
    )
    .map((r) => ({
      id: r.id,
      guildId: r.guildId,
      announcementChannelId: r.announcementChannelId,
      announcementMessageId: r.announcementMessageId,
      bonusPercent: r.bonusPercent,
      durationHours: r.durationHours,
      reason: r.reason,
      setByDiscordUserId: r.setByDiscordUserId,
    }));
}

export async function markGlobalXpBoostExpiryReplySent(args: {
  id: number;
  at: Date;
}): Promise<void> {
  const db = getDb();
  await db
    .update(globalXpBoosts)
    .set({ expiryReplySentAt: args.at })
    .where(eq(globalXpBoosts.id, args.id));
}

export async function expireActiveGlobalXpBoosts(args: {
  guildId: string;
  now: Date;
}): Promise<number> {
  const db = getDb();
  const cutoff = new Date(args.now.getTime() - 1);
  const rows = await db
    .update(globalXpBoosts)
    .set({ expiresAt: cutoff })
    .where(and(eq(globalXpBoosts.guildId, args.guildId), gt(globalXpBoosts.expiresAt, args.now)))
    .returning({ id: globalXpBoosts.id });

  return rows.length;
}

export async function getActiveBoostMultiplierMax(guildId: string, now: Date): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ m: sql<number | null>`max(${globalXpBoosts.multiplier})` })
    .from(globalXpBoosts)
    .where(and(eq(globalXpBoosts.guildId, guildId), gt(globalXpBoosts.expiresAt, now)));
  const raw = rows[0]?.m;

  if (raw === null) {
    return 1;
  }

  return raw > 0 ? raw : 1;
}

export async function updateTeamXpAbsolute(
  args: {
    guildId: string;
    userId: string;
    xp: number;
  },
  db: TeamXpDbExecutor = getDb(),
): Promise<void> {
  await db
    .insert(teamXp)
    .values({
      guildId: args.guildId,
      userId: args.userId,
      xp: args.xp,
    })
    .onConflictDoUpdate({
      target: [teamXp.guildId, teamXp.userId],
      set: {
        xp: args.xp,
      },
    });
  await db.insert(teamXpHistory).values({
    guildId: args.guildId,
    userId: args.userId,
    xp: args.xp,
  });
  const avgXp = await getAverageTeamXp(args.guildId, db);
  await db.insert(teamXpHistory).values({
    guildId: args.guildId,
    userId: "AVERAGE",
    xp: avgXp,
  });
}

export async function hasSnapshotToday(guildId: string): Promise<boolean> {
  const db = getDb();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({ id: teamXpHistory.id })
    .from(teamXpHistory)
    .where(and(eq(teamXpHistory.guildId, guildId), gte(teamXpHistory.createdAt, today)))
    .limit(1);

  return rows.length > 0;
}

export async function snapshotTeamXp(guildId: string): Promise<void> {
  const db = getDb();
  const avgXp = await getAverageTeamXp(guildId);
  await db.insert(teamXpHistory).values({
    guildId,
    userId: "AVERAGE",
    xp: avgXp,
  });
}

export async function cleanupOldTeamXpHistory(guildId: string): Promise<void> {
  const db = getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db
    .delete(teamXpHistory)
    .where(and(eq(teamXpHistory.guildId, guildId), lt(teamXpHistory.createdAt, sevenDaysAgo)));
}

export async function getTeamXpHistory(
  guildId: string,
  userId: string,
): Promise<
  Array<{
    xp: number;
    createdAt: Date;
  }>
> {
  const db = getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ xp: teamXpHistory.xp, createdAt: teamXpHistory.createdAt })
    .from(teamXpHistory)
    .where(
      and(
        eq(teamXpHistory.guildId, guildId),
        eq(teamXpHistory.userId, userId),
        gte(teamXpHistory.createdAt, sevenDaysAgo),
      ),
    )
    .orderBy(desc(teamXpHistory.createdAt))
    .limit(1000);

  return rows.reverse();
}
