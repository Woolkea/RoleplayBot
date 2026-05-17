import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { feedbackEntries } from "@/db/schema.js";

export type NewFeedbackEntry = {
  guildId: string;
  authorDiscordUserId: string;
  targetDiscordUserId: string;
  category: string;
  stars: string;
  reason: string;
  messageUrl: string | null;
};

export async function insertFeedbackEntry(row: NewFeedbackEntry): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(feedbackEntries)
    .values({
      guildId: row.guildId,
      authorDiscordUserId: row.authorDiscordUserId,
      targetDiscordUserId: row.targetDiscordUserId,
      category: row.category,
      stars: row.stars,
      reason: row.reason,
      messageUrl: row.messageUrl,
    })
    .returning({ id: feedbackEntries.id });

  if (rows.length === 0) {
    throw new Error("insertFeedbackEntry: empty returning");
  }

  return rows[0].id;
}

export async function getLastFeedbackEntryByAuthor(args: {
  guildId: string;
  authorUserId: string;
}): Promise<
  | {
      createdAt: Date;
    }
  | undefined
> {
  const db = getDb();
  const rows = await db
    .select({ createdAt: feedbackEntries.createdAt })
    .from(feedbackEntries)
    .where(
      and(
        eq(feedbackEntries.guildId, args.guildId),
        eq(feedbackEntries.authorDiscordUserId, args.authorUserId),
      ),
    )
    .orderBy(desc(feedbackEntries.createdAt))
    .limit(1);

  return rows[0];
}

export function parseStoredFeedbackStars(stars: string): number | null {
  const fromLabel = stars.match(/\(([1-5])\/5\)/);

  if (fromLabel?.[1] !== undefined) {
    return Number.parseInt(fromLabel[1], 10);
  }

  const t = stars.trim();

  if (/^[1-5]$/.test(t)) {
    return Number.parseInt(t, 10);
  }

  return null;
}

export async function getFeedbackTargetStats(args: {
  guildId: string;
  targetUserId: string;
}): Promise<{
  count: number;
  avgStars: number | null;
}> {
  const db = getDb();
  const rows = await db
    .select({ stars: feedbackEntries.stars })
    .from(feedbackEntries)
    .where(
      and(
        eq(feedbackEntries.guildId, args.guildId),
        eq(feedbackEntries.targetDiscordUserId, args.targetUserId),
      ),
    );
  const count = rows.length;

  if (count === 0) {
    return { count: 0, avgStars: null };
  }

  let sum = 0;
  let parsed = 0;

  for (const row of rows) {
    const n = parseStoredFeedbackStars(row.stars);

    if (n !== null) {
      sum += n;
      parsed += 1;
    }
  }

  return {
    count,
    avgStars: parsed === 0 ? null : sum / parsed,
  };
}
