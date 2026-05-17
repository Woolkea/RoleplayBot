import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { ingameServerStatsState, ingameServerStatsTeamXpCooldown } from "@/db/schema.js";

export type IngameServerStatsStateRow = {
  guildId: string;
  panelMessageId: string | null;
  ownerDisplay: string;
  playersCurrent: number;
  joinCode: string;
  lastUpdatedAt: Date | null;
  lastUpdatedByDiscordUserId: string | null;
};

export async function getIngameServerStatsState(
  guildId: string,
): Promise<IngameServerStatsStateRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(ingameServerStatsState)
    .where(eq(ingameServerStatsState.guildId, guildId))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const r = rows[0];

  return {
    guildId: r.guildId,
    panelMessageId: r.panelMessageId,
    ownerDisplay: r.ownerDisplay,
    playersCurrent: r.playersCurrent,
    joinCode: r.joinCode,
    lastUpdatedAt: r.lastUpdatedAt,
    lastUpdatedByDiscordUserId: r.lastUpdatedByDiscordUserId,
  };
}

export async function upsertIngameServerStatsState(row: IngameServerStatsStateRow): Promise<void> {
  const db = getDb();
  await db
    .insert(ingameServerStatsState)
    .values({
      guildId: row.guildId,
      panelMessageId: row.panelMessageId,
      ownerDisplay: row.ownerDisplay,
      playersCurrent: row.playersCurrent,
      joinCode: row.joinCode,
      lastUpdatedAt: row.lastUpdatedAt,
      lastUpdatedByDiscordUserId: row.lastUpdatedByDiscordUserId,
    })
    .onConflictDoUpdate({
      target: ingameServerStatsState.guildId,
      set: {
        panelMessageId: row.panelMessageId,
        ownerDisplay: row.ownerDisplay,
        playersCurrent: row.playersCurrent,
        joinCode: row.joinCode,
        lastUpdatedAt: row.lastUpdatedAt,
        lastUpdatedByDiscordUserId: row.lastUpdatedByDiscordUserId,
      },
    });
}

export async function getIngameServerStatsTeamXpCooldown(args: {
  guildId: string;
  userId: string;
}): Promise<Date | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(ingameServerStatsTeamXpCooldown)
    .where(
      and(
        eq(ingameServerStatsTeamXpCooldown.guildId, args.guildId),
        eq(ingameServerStatsTeamXpCooldown.userId, args.userId),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return rows[0].lastAwardedAt;
}

export async function setIngameServerStatsTeamXpCooldown(args: {
  guildId: string;
  userId: string;
  at: Date;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(ingameServerStatsTeamXpCooldown)
    .values({
      guildId: args.guildId,
      userId: args.userId,
      lastAwardedAt: args.at,
    })
    .onConflictDoUpdate({
      target: [ingameServerStatsTeamXpCooldown.guildId, ingameServerStatsTeamXpCooldown.userId],
      set: { lastAwardedAt: args.at },
    });
}
