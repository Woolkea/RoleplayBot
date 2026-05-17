import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { officeRequests } from "@/db/schema.js";

export type OfficeRequestRow = typeof officeRequests.$inferSelect;

export async function insertOfficeRequestDraft(args: {
  guildId: string;
  requesterDiscordUserId: string;
  joinedAt: Date;
}): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(officeRequests)
    .values({
      guildId: args.guildId,
      requesterDiscordUserId: args.requesterDiscordUserId,
      joinedAt: args.joinedAt,
    })
    .returning({ id: officeRequests.id });

  if (rows.length === 0) {
    throw new Error("insertOfficeRequestDraft: empty returning");
  }

  return rows[0].id;
}

export async function setOfficeRequestLogMessage(args: {
  id: number;
  logChannelId: string;
  logMessageId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .update(officeRequests)
    .set({
      logChannelId: args.logChannelId,
      logMessageId: args.logMessageId,
    })
    .where(eq(officeRequests.id, args.id));
}

export async function getOfficeRequestById(id: number): Promise<OfficeRequestRow | undefined> {
  const db = getDb();
  const rows = await db.select().from(officeRequests).where(eq(officeRequests.id, id)).limit(1);

  return rows[0];
}

export async function findOpenOfficeRequestByGuildAndRequester(args: {
  guildId: string;
  requesterDiscordUserId: string;
}): Promise<OfficeRequestRow | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(officeRequests)
    .where(
      and(
        eq(officeRequests.guildId, args.guildId),
        eq(officeRequests.requesterDiscordUserId, args.requesterDiscordUserId),
        eq(officeRequests.status, "open"),
      ),
    )
    .limit(1);

  return rows[0];
}

export async function claimOfficeRequestIfOpen(args: {
  id: number;
  claimedByDiscordUserId: string;
  claimedByDisplayName: string;
  claimedAt: Date;
}): Promise<OfficeRequestRow | null> {
  const db = getDb();
  const rows = await db
    .update(officeRequests)
    .set({
      status: "claimed",
      claimedByDiscordUserId: args.claimedByDiscordUserId,
      claimedByDisplayName: args.claimedByDisplayName,
      claimedAt: args.claimedAt,
    })
    .where(and(eq(officeRequests.id, args.id), eq(officeRequests.status, "open")))
    .returning();

  return rows[0] ?? null;
}

export async function revertOfficeRequestClaimAfterFailedMove(args: {
  id: number;
  claimedByDiscordUserId: string;
}): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .update(officeRequests)
    .set({
      status: "open",
      claimedByDiscordUserId: null,
      claimedByDisplayName: null,
      claimedAt: null,
    })
    .where(
      and(
        eq(officeRequests.id, args.id),
        eq(officeRequests.status, "claimed"),
        eq(officeRequests.claimedByDiscordUserId, args.claimedByDiscordUserId),
      ),
    )
    .returning({ id: officeRequests.id });

  return rows.length > 0;
}

export async function deleteOpenOfficeRequestByGuildAndRequester(args: {
  guildId: string;
  requesterDiscordUserId: string;
}): Promise<{
  id: number;
  logChannelId: string | null;
  logMessageId: string | null;
} | null> {
  const db = getDb();
  const rows = await db
    .delete(officeRequests)
    .where(
      and(
        eq(officeRequests.guildId, args.guildId),
        eq(officeRequests.requesterDiscordUserId, args.requesterDiscordUserId),
        eq(officeRequests.status, "open"),
      ),
    )
    .returning({
      id: officeRequests.id,
      logChannelId: officeRequests.logChannelId,
      logMessageId: officeRequests.logMessageId,
    });

  return rows[0] ?? null;
}

export async function deleteOfficeRequestById(id: number): Promise<void> {
  const db = getDb();
  await db.delete(officeRequests).where(eq(officeRequests.id, id));
}
