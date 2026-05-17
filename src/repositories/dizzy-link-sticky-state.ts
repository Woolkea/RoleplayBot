import { eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { dizzyLinkStickyState } from "@/db/schema.js";

export async function getDizzyLinkStickyState(guildId: string): Promise<{
  channelId: string;
  stickyMessageId: string;
} | null> {
  const db = getDb();
  const rows = await db
    .select({
      channelId: dizzyLinkStickyState.channelId,
      stickyMessageId: dizzyLinkStickyState.stickyMessageId,
    })
    .from(dizzyLinkStickyState)
    .where(eq(dizzyLinkStickyState.guildId, guildId))
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  return row;
}

export async function upsertDizzyLinkStickyState(args: {
  guildId: string;
  channelId: string;
  stickyMessageId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(dizzyLinkStickyState)
    .values({
      guildId: args.guildId,
      channelId: args.channelId,
      stickyMessageId: args.stickyMessageId,
    })
    .onConflictDoUpdate({
      target: dizzyLinkStickyState.guildId,
      set: {
        channelId: args.channelId,
        stickyMessageId: args.stickyMessageId,
      },
    });
}
