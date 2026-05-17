import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { teamMemberTextStatus, teamMemberTextStatusHistory } from "@/db/schema.js";

export async function getTeamMemberTextStatus(args: { guildId: string; userId: string }): Promise<{
  description: string;
  setByDiscordUserId: string;
  updatedAt: Date;
} | null> {
  const db = getDb();
  const rows = await db
    .select({
      description: teamMemberTextStatus.description,
      setByDiscordUserId: teamMemberTextStatus.setByDiscordUserId,
      updatedAt: teamMemberTextStatus.updatedAt,
    })
    .from(teamMemberTextStatus)
    .where(
      and(
        eq(teamMemberTextStatus.guildId, args.guildId),
        eq(teamMemberTextStatus.userId, args.userId),
      ),
    )
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  return row;
}

export async function getPreviousHistoryAuthor(args: { guildId: string; userId: string }): Promise<{
  setByDiscordUserId: string;
} | null> {
  const db = getDb();
  const rows = await db
    .select({
      setByDiscordUserId: teamMemberTextStatusHistory.setByDiscordUserId,
    })
    .from(teamMemberTextStatusHistory)
    .where(
      and(
        eq(teamMemberTextStatusHistory.guildId, args.guildId),
        eq(teamMemberTextStatusHistory.userId, args.userId),
      ),
    )
    .orderBy(desc(teamMemberTextStatusHistory.createdAt))
    .limit(2);

  if (rows.length < 2) {
    return null;
  }

  return rows[1];
}

export async function upsertTeamMemberTextStatus(args: {
  guildId: string;
  targetUserId: string;
  setByDiscordUserId: string;
  description: string;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .insert(teamMemberTextStatus)
      .values({
        guildId: args.guildId,
        userId: args.targetUserId,
        description: args.description,
        setByDiscordUserId: args.setByDiscordUserId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [teamMemberTextStatus.guildId, teamMemberTextStatus.userId],
        set: {
          description: args.description,
          setByDiscordUserId: args.setByDiscordUserId,
          updatedAt: now,
        },
      });
    await tx.insert(teamMemberTextStatusHistory).values({
      guildId: args.guildId,
      userId: args.targetUserId,
      description: args.description,
      setByDiscordUserId: args.setByDiscordUserId,
    });
  });
}
