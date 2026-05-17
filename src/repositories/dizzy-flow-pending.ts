import { and, eq, lt } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { dizzyFlowPending } from "@/db/schema.js";

export type DizzyFlowPendingRow = {
  flowId: string;
  guildId: string;
  kind: string;
  confirmUserId: string;
  targetDiscordUserId: string;
  moderatorDiscordUserId: string | null;
  robloxUserId: string;
  robloxUsername: string;
  robloxDisplayName: string;
  robloxHeadshotUrl: string;
  expiresAt: Date;
  createdAt: Date;
};

export async function insertDizzyFlowPending(row: {
  flowId: string;
  guildId: string;
  kind: string;
  confirmUserId: string;
  targetDiscordUserId: string;
  moderatorDiscordUserId: string | null;
  robloxUserId: string;
  robloxUsername: string;
  robloxDisplayName: string;
  robloxHeadshotUrl: string;
  expiresAt: Date;
}): Promise<void> {
  const db = getDb();
  await db.insert(dizzyFlowPending).values({
    flowId: row.flowId,
    guildId: row.guildId,
    kind: row.kind,
    confirmUserId: row.confirmUserId,
    targetDiscordUserId: row.targetDiscordUserId,
    moderatorDiscordUserId: row.moderatorDiscordUserId,
    robloxUserId: row.robloxUserId,
    robloxUsername: row.robloxUsername,
    robloxDisplayName: row.robloxDisplayName,
    robloxHeadshotUrl: row.robloxHeadshotUrl,
    expiresAt: row.expiresAt,
  });
}

export async function getDizzyFlowPendingIfValid(
  flowId: string,
  now: Date,
): Promise<DizzyFlowPendingRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(dizzyFlowPending)
    .where(eq(dizzyFlowPending.flowId, flowId))
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  if (row.expiresAt.getTime() <= now.getTime()) {
    await db.delete(dizzyFlowPending).where(eq(dizzyFlowPending.flowId, flowId));

    return null;
  }

  return {
    flowId: row.flowId,
    guildId: row.guildId,
    kind: row.kind,
    confirmUserId: row.confirmUserId,
    targetDiscordUserId: row.targetDiscordUserId,
    moderatorDiscordUserId: row.moderatorDiscordUserId,
    robloxUserId: row.robloxUserId,
    robloxUsername: row.robloxUsername,
    robloxDisplayName: row.robloxDisplayName,
    robloxHeadshotUrl: row.robloxHeadshotUrl,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export async function deleteDizzyFlowPending(flowId: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(dizzyFlowPending)
    .where(eq(dizzyFlowPending.flowId, flowId))
    .returning({
      flowId: dizzyFlowPending.flowId,
    });

  return result.length > 0;
}

export async function deleteExpiredDizzyFlowPending(now: Date): Promise<number> {
  const db = getDb();
  const result = await db
    .delete(dizzyFlowPending)
    .where(lt(dizzyFlowPending.expiresAt, now))
    .returning({
      flowId: dizzyFlowPending.flowId,
    });

  return result.length;
}

export async function deletePendingFlowsForConfirmUserInGuild(args: {
  guildId: string;
  confirmUserId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .delete(dizzyFlowPending)
    .where(
      and(
        eq(dizzyFlowPending.guildId, args.guildId),
        eq(dizzyFlowPending.confirmUserId, args.confirmUserId),
      ),
    );
}
