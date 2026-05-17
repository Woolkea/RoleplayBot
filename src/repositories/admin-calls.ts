import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { adminCalls } from "@/db/schema.js";

export type NewAdminCall = {
  guildId: string;
  authorDiscordUserId: string;
  robloxUserId: string;
  robloxUsername: string;
  robloxDisplayName: string;
  robloxAvatarUrl: string;
  serverShard: string;
  location: string;
  reason: string;
};

export type AdminCallRow = typeof adminCalls.$inferSelect;

export async function insertAdminCall(row: NewAdminCall): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(adminCalls)
    .values({
      guildId: row.guildId,
      authorDiscordUserId: row.authorDiscordUserId,
      robloxUserId: row.robloxUserId,
      robloxUsername: row.robloxUsername,
      robloxDisplayName: row.robloxDisplayName,
      robloxAvatarUrl: row.robloxAvatarUrl,
      serverShard: row.serverShard,
      location: row.location,
      reason: row.reason,
    })
    .returning({ id: adminCalls.id });

  if (rows.length === 0) {
    throw new Error("insertAdminCall: empty returning");
  }

  return rows[0].id;
}

export async function deleteAdminCall(callId: number): Promise<void> {
  const db = getDb();
  await db.delete(adminCalls).where(eq(adminCalls.id, callId));
}

export async function claimAdminCall(args: {
  callId: number;
  claimedByUserId: string;
}): Promise<AdminCallRow | null> {
  const db = getDb();
  const rows = await db
    .update(adminCalls)
    .set({
      status: "claimed",
      claimedByDiscordUserId: args.claimedByUserId,
    })
    .where(and(eq(adminCalls.id, args.callId), eq(adminCalls.status, "open")))
    .returning();

  return rows[0] ?? null;
}

export async function getAdminCall(callId: number): Promise<AdminCallRow | undefined> {
  const db = getDb();
  const rows = await db.select().from(adminCalls).where(eq(adminCalls.id, callId)).limit(1);

  return rows[0];
}
