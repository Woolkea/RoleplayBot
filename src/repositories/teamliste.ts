import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client.js";

import { teamlisteCategories, teamlisteConfig } from "@/db/schema.js";

export type TeamlisteCategoryRow = {
  id: number;
  guildId: string;
  name: string;
  roles: string[];
};

function parsePanelMessageIdsJson(json: string): string[] {
  try {
    const v = JSON.parse(json) as unknown;

    if (!Array.isArray(v)) {
      return [];
    }

    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export async function getTeamlisteConfig(guildId: string): Promise<{
  guildId: string;
  channelId: string;
  panelMessageIds: string[];
} | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(teamlisteConfig)
    .where(eq(teamlisteConfig.guildId, guildId))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    guildId: row.guildId,
    channelId: row.channelId,
    panelMessageIds: parsePanelMessageIdsJson(row.panelMessageIdsJson),
  };
}

export async function upsertTeamlisteConfig(args: {
  guildId: string;
  channelId: string;
  panelMessageIds: string[];
}): Promise<void> {
  const db = getDb();
  const payload = JSON.stringify(args.panelMessageIds);
  await db
    .insert(teamlisteConfig)
    .values({
      guildId: args.guildId,
      channelId: args.channelId,
      panelMessageIdsJson: payload,
    })
    .onConflictDoUpdate({
      target: teamlisteConfig.guildId,
      set: {
        channelId: args.channelId,
        panelMessageIdsJson: payload,
      },
    });
}

export async function listTeamlisteCategories(guildId: string): Promise<TeamlisteCategoryRow[]> {
  const db = getDb();

  return db
    .select()
    .from(teamlisteCategories)
    .where(eq(teamlisteCategories.guildId, guildId))
    .orderBy(asc(teamlisteCategories.id));
}

export async function insertTeamlisteCategory(args: {
  guildId: string;
  name: string;
  roles: string[];
}): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(teamlisteCategories)
    .values({
      guildId: args.guildId,
      name: args.name,
      roles: args.roles,
    })
    .returning({ id: teamlisteCategories.id });

  if (rows.length === 0) {
    throw new Error("insertTeamlisteCategory: empty returning");
  }

  return rows[0].id;
}

export async function updateTeamlisteCategory(args: {
  id: number;
  guildId: string;
  name: string;
  roles: string[];
}): Promise<boolean> {
  const db = getDb();
  const result = await db
    .update(teamlisteCategories)
    .set({ name: args.name, roles: args.roles })
    .where(and(eq(teamlisteCategories.id, args.id), eq(teamlisteCategories.guildId, args.guildId)))
    .returning({ id: teamlisteCategories.id });

  return result.length > 0;
}

export async function getTeamlisteCategoryById(args: {
  id: number;
  guildId: string;
}): Promise<TeamlisteCategoryRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(teamlisteCategories)
    .where(and(eq(teamlisteCategories.id, args.id), eq(teamlisteCategories.guildId, args.guildId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteTeamlisteCategory(args: {
  id: number;
  guildId: string;
}): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(teamlisteCategories)
    .where(and(eq(teamlisteCategories.id, args.id), eq(teamlisteCategories.guildId, args.guildId)))
    .returning({ id: teamlisteCategories.id });

  return result.length > 0;
}
