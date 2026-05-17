import { and, desc, eq } from "drizzle-orm";

import { ingameModerationEntries } from "@/db/schema.js";

import { getDb } from "@/db/client.js";

export type IngameModerationEntryRow = typeof ingameModerationEntries.$inferSelect;

export type NewIngameModerationEntry = {
  guildId: string;
  serverShard: string;
  targetRobloxUserId: string;
  targetDisplayName: string;
  targetUsername: string;
  moderatorDiscordUserId: string;
  action: string;
  durationDays: number | null;
  isPermanent: boolean;
  reason: string;
};

export async function insertIngameModerationEntry(row: NewIngameModerationEntry): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(ingameModerationEntries)
    .values({
      guildId: row.guildId,
      serverShard: row.serverShard,
      targetRobloxUserId: row.targetRobloxUserId,
      targetDisplayName: row.targetDisplayName,
      targetUsername: row.targetUsername,
      moderatorDiscordUserId: row.moderatorDiscordUserId,
      action: row.action,
      durationDays: row.durationDays,
      isPermanent: row.isPermanent,
      reason: row.reason,
    })
    .returning({ id: ingameModerationEntries.id });

  if (rows.length === 0) {
    throw new Error("insertIngameModerationEntry: empty returning");
  }

  return rows[0].id;
}

export async function listIngameModerationEntriesByTarget(args: {
  guildId: string;
  serverShard: string;
  targetRobloxUserId: string;
}): Promise<(typeof ingameModerationEntries.$inferSelect)[]> {
  const db = getDb();

  return db
    .select()
    .from(ingameModerationEntries)
    .where(
      and(
        eq(ingameModerationEntries.guildId, args.guildId),
        eq(ingameModerationEntries.serverShard, args.serverShard),
        eq(ingameModerationEntries.targetRobloxUserId, args.targetRobloxUserId),
      ),
    )
    .orderBy(desc(ingameModerationEntries.createdAt));
}

export async function getIngameModerationEntryById(
  id: number,
): Promise<IngameModerationEntryRow | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(ingameModerationEntries)
    .where(eq(ingameModerationEntries.id, id))
    .limit(1);

  return rows[0];
}

export async function deleteIngameModerationEntryById(id: number): Promise<void> {
  const db = getDb();
  await db.delete(ingameModerationEntries).where(eq(ingameModerationEntries.id, id));
}
