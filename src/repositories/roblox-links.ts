import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { robloxLinks } from "@/db/schema.js";

export type RobloxLinkRow = {
  guildId: string;
  discordUserId: string;
  robloxUserId: string;
  robloxUsername: string;
  robloxDisplayName: string;
  robloxAvatarUrl: string | null;
  robloxCreatedAt: Date | null;
  addedAt: Date;
};

export async function upsertRobloxLink(args: {
  guildId: string;
  discordUserId: string;
  robloxUserId: string;
  robloxUsername: string;
  robloxDisplayName: string;
  robloxAvatarUrl: string | null;
  robloxCreatedAt: Date | null;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(robloxLinks)
    .values({
      guildId: args.guildId,
      discordUserId: args.discordUserId,
      robloxUserId: args.robloxUserId,
      robloxUsername: args.robloxUsername,
      robloxDisplayName: args.robloxDisplayName,
      robloxAvatarUrl: args.robloxAvatarUrl,
      robloxCreatedAt: args.robloxCreatedAt,
    })
    .onConflictDoUpdate({
      target: [robloxLinks.guildId, robloxLinks.discordUserId],
      set: {
        robloxUserId: args.robloxUserId,
        robloxUsername: args.robloxUsername,
        robloxDisplayName: args.robloxDisplayName,
        robloxAvatarUrl: args.robloxAvatarUrl,
        robloxCreatedAt: args.robloxCreatedAt,
        addedAt: new Date(),
      },
    });
}

export async function deleteRobloxLink(args: {
  guildId: string;
  discordUserId: string;
}): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(robloxLinks)
    .where(
      and(eq(robloxLinks.guildId, args.guildId), eq(robloxLinks.discordUserId, args.discordUserId)),
    )
    .returning({ discordUserId: robloxLinks.discordUserId });

  return result.length > 0;
}

export async function getRobloxLink(args: {
  guildId: string;
  discordUserId: string;
}): Promise<RobloxLinkRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(robloxLinks)
    .where(
      and(eq(robloxLinks.guildId, args.guildId), eq(robloxLinks.discordUserId, args.discordUserId)),
    )
    .limit(1);
  const row = rows.at(0);

  if (row === undefined) {
    return null;
  }

  return {
    guildId: row.guildId,
    discordUserId: row.discordUserId,
    robloxUserId: row.robloxUserId,
    robloxUsername: row.robloxUsername,
    robloxDisplayName: row.robloxDisplayName,
    robloxAvatarUrl: row.robloxAvatarUrl,
    robloxCreatedAt: row.robloxCreatedAt,
    addedAt: row.addedAt,
  };
}

export async function listDiscordUserIdsByGuildAndRobloxUserId(args: {
  guildId: string;
  robloxUserId: string;
}): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ discordUserId: robloxLinks.discordUserId })
    .from(robloxLinks)
    .where(
      and(eq(robloxLinks.guildId, args.guildId), eq(robloxLinks.robloxUserId, args.robloxUserId)),
    );

  return rows.map((r) => r.discordUserId);
}

export async function getRobloxLinksByDiscordUserIds(args: {
  guildId: string;
  discordUserIds: string[];
}): Promise<Map<string, RobloxLinkRow>> {
  const map = new Map<string, RobloxLinkRow>();

  if (args.discordUserIds.length === 0) {
    return map;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(robloxLinks)
    .where(
      and(
        eq(robloxLinks.guildId, args.guildId),
        inArray(robloxLinks.discordUserId, args.discordUserIds),
      ),
    );

  for (const row of rows) {
    map.set(row.discordUserId, {
      guildId: row.guildId,
      discordUserId: row.discordUserId,
      robloxUserId: row.robloxUserId,
      robloxUsername: row.robloxUsername,
      robloxDisplayName: row.robloxDisplayName,
      robloxAvatarUrl: row.robloxAvatarUrl,
      robloxCreatedAt: row.robloxCreatedAt,
      addedAt: row.addedAt,
    });
  }

  return map;
}
