import { ChannelType, type Client, type GuildTextBasedChannel } from "discord.js";

import type { AppEnv } from "@/config/env.js";

import {
  getIngameServerStatsState,
  setIngameServerStatsTeamXpCooldown,
  getIngameServerStatsTeamXpCooldown,
  upsertIngameServerStatsState,
  type IngameServerStatsStateRow,
} from "@/repositories/ingame-server-stats.js";

import { teamXpService } from "@/services/team-xp/xp-service.js";

import {
  INGAME_SERVER_STATS_DEFAULT_OWNER_DISPLAY,
  INGAME_SERVER_STATS_JOIN_CODE_MAX_LENGTH,
  INGAME_SERVER_STATS_MAX_PLAYERS,
  INGAME_SERVER_STATS_OWNER_MAX_LENGTH,
  INGAME_SERVER_STATS_PANEL_BANNER_DEFAULT_URL,
  INGAME_SERVER_STATS_TEAM_XP_AMOUNT,
  INGAME_SERVER_STATS_TEAM_XP_COOLDOWN_MS,
} from "./constants.js";

import { IngameServerStatsUserFacingError } from "./ingame-server-stats-user-error.js";

import {
  buildIngameServerStatsPanelContainer,
  ingameServerStatsPanelAllowedMentions,
  ingameServerStatsV2Flags,
} from "./ui-builders.js";

function requireStatsChannelId(env: AppEnv): string {
  const id = env.ingameServerStatsChannelId;

  if (id === undefined || id.trim() === "") {
    throw new IngameServerStatsUserFacingError(
      "Ingame-Server-Stats: `INGAME_SERVER_STATS_CHANNEL_ID` ist in der Bot-Konfiguration nicht gesetzt.",
    );
  }

  return id.trim();
}

async function resolveStatsTextChannel(
  client: Client,
  channelId: string,
): Promise<GuildTextBasedChannel> {
  const ch =
    client.channels.cache.get(channelId) ??
    (await client.channels.fetch(channelId).catch(() => null));

  if (ch === null || ch.type !== ChannelType.GuildText) {
    throw new IngameServerStatsUserFacingError(
      "Der konfigurierte Ingame-Server-Stats-Kanal wurde nicht gefunden oder ist kein Textkanal.",
    );
  }

  return ch;
}

async function getOrCreateStateRow(guildId: string): Promise<IngameServerStatsStateRow> {
  const existing = await getIngameServerStatsState(guildId);

  if (existing !== null) {
    return existing;
  }

  return {
    guildId,
    panelMessageId: null,
    ownerDisplay: INGAME_SERVER_STATS_DEFAULT_OWNER_DISPLAY,
    playersCurrent: 0,
    joinCode: "",
    lastUpdatedAt: null,
    lastUpdatedByDiscordUserId: null,
  };
}

async function postOrUpdatePanel(args: {
  client: Client;
  env: AppEnv;
  row: IngameServerStatsStateRow;
}): Promise<IngameServerStatsStateRow> {
  const channelId = requireStatsChannelId(args.env);
  const channel = await resolveStatsTextChannel(args.client, channelId);
  const thumbnailUrl = args.env.ingameServerStatsThumbnailUrl;
  const bannerFromEnv = args.env.ingameServerStatsBannerUrl?.trim();
  const bannerUrl =
    bannerFromEnv !== undefined && bannerFromEnv !== ""
      ? bannerFromEnv
      : INGAME_SERVER_STATS_PANEL_BANNER_DEFAULT_URL;
  const panel = buildIngameServerStatsPanelContainer({
    row: args.row,
    thumbnailUrl: thumbnailUrl ?? undefined,
    bannerUrl,
  });
  const components = [panel];
  const flags = ingameServerStatsV2Flags();
  const allowedMentions = ingameServerStatsPanelAllowedMentions(args.row);
  const nextMessageId = args.row.panelMessageId;

  if (nextMessageId !== null) {
    const msg = await channel.messages.fetch(nextMessageId).catch(() => null);

    if (msg !== null && msg.editable) {
      await msg.edit({
        flags,
        components,
        allowedMentions,
      });

      return args.row;
    }
  }

  const sent = await channel.send({
    flags,
    components,
    allowedMentions,
  });
  const updated: IngameServerStatsStateRow = { ...args.row, panelMessageId: sent.id };
  await upsertIngameServerStatsState(updated);

  return updated;
}

async function tryAwardTeamStatsXp(args: { guildId: string; userId: string; at: Date }): Promise<{
  gained: number;
  cooldownActive: boolean;
}> {
  const last = await getIngameServerStatsTeamXpCooldown({
    guildId: args.guildId,
    userId: args.userId,
  });
  const nowMs = args.at.getTime();

  if (last !== null && nowMs - last.getTime() < INGAME_SERVER_STATS_TEAM_XP_COOLDOWN_MS) {
    return { gained: 0, cooldownActive: true };
  }

  const gained = await teamXpService.addXp(
    args.guildId,
    args.userId,
    INGAME_SERVER_STATS_TEAM_XP_AMOUNT,
    args.at,
  );

  if (gained > 0) {
    await setIngameServerStatsTeamXpCooldown({
      guildId: args.guildId,
      userId: args.userId,
      at: args.at,
    });
  }

  return { gained, cooldownActive: false };
}

export const ingameServerStatsService = {
  async getStatsTeamActionBlockedUntil(args: {
    guildId: string;
    userId: string;
    at: Date;
  }): Promise<Date | null> {
    const last = await getIngameServerStatsTeamXpCooldown({
      guildId: args.guildId,
      userId: args.userId,
    });

    if (last === null) {
      return null;
    }

    const next = new Date(last.getTime() + INGAME_SERVER_STATS_TEAM_XP_COOLDOWN_MS);

    if (args.at.getTime() < next.getTime()) {
      return next;
    }

    return null;
  },
  async setJoinCode(args: {
    client: Client;
    env: AppEnv;
    guildId: string;
    actorUserId: string;
    code: string | null;
    at: Date;
  }): Promise<void> {
    const raw = (args.code ?? "").trim();

    if (raw.length > INGAME_SERVER_STATS_JOIN_CODE_MAX_LENGTH) {
      throw new IngameServerStatsUserFacingError(
        `Der Code darf höchstens ${String(INGAME_SERVER_STATS_JOIN_CODE_MAX_LENGTH)} Zeichen lang sein.`,
      );
    }

    let row = await getOrCreateStateRow(args.guildId);
    row = {
      ...row,
      joinCode: raw,
      lastUpdatedAt: args.at,
      lastUpdatedByDiscordUserId: args.actorUserId,
    };
    await upsertIngameServerStatsState(row);
    await postOrUpdatePanel({ client: args.client, env: args.env, row });
  },
  async setPlayers(args: {
    client: Client;
    env: AppEnv;
    guildId: string;
    userId: string;
    count: number;
    at: Date;
  }): Promise<{
    gained: number;
    cooldownActive: boolean;
  }> {
    if (
      !Number.isInteger(args.count) ||
      args.count < 0 ||
      args.count > INGAME_SERVER_STATS_MAX_PLAYERS
    ) {
      throw new IngameServerStatsUserFacingError(
        `Spieleranzahl muss eine ganze Zahl zwischen 0 und ${String(INGAME_SERVER_STATS_MAX_PLAYERS)} sein.`,
      );
    }

    let row = await getOrCreateStateRow(args.guildId);
    row = {
      ...row,
      playersCurrent: args.count,
      lastUpdatedAt: args.at,
      lastUpdatedByDiscordUserId: args.userId,
    };
    await upsertIngameServerStatsState(row);
    await postOrUpdatePanel({ client: args.client, env: args.env, row });
    const last = await getIngameServerStatsTeamXpCooldown({
      guildId: args.guildId,
      userId: args.userId,
    });
    const nowMs = args.at.getTime();
    let gained = 0;
    let cooldownActive = false;

    if (last !== null && nowMs - last.getTime() < INGAME_SERVER_STATS_TEAM_XP_COOLDOWN_MS) {
      cooldownActive = true;
    } else {
      gained = await teamXpService.addXp(
        args.guildId,
        args.userId,
        INGAME_SERVER_STATS_TEAM_XP_AMOUNT,
        args.at,
      );
    }

    await setIngameServerStatsTeamXpCooldown({
      guildId: args.guildId,
      userId: args.userId,
      at: args.at,
    });

    return { gained, cooldownActive };
  },
  async setOwnerDisplay(args: {
    client: Client;
    env: AppEnv;
    guildId: string;
    userId: string;
    text: string;
    at: Date;
  }): Promise<{
    gained: number;
    cooldownActive: boolean;
  }> {
    const t = args.text.trim();

    if (t.length === 0) {
      throw new IngameServerStatsUserFacingError("Der Owner-Text darf nicht leer sein.");
    }

    if (t.length > INGAME_SERVER_STATS_OWNER_MAX_LENGTH) {
      throw new IngameServerStatsUserFacingError(
        `Der Owner-Text darf höchstens ${String(INGAME_SERVER_STATS_OWNER_MAX_LENGTH)} Zeichen lang sein.`,
      );
    }

    let row = await getOrCreateStateRow(args.guildId);
    row = {
      ...row,
      ownerDisplay: t,
      lastUpdatedAt: args.at,
      lastUpdatedByDiscordUserId: args.userId,
    };
    await upsertIngameServerStatsState(row);
    await postOrUpdatePanel({ client: args.client, env: args.env, row });

    return tryAwardTeamStatsXp({ guildId: args.guildId, userId: args.userId, at: args.at });
  },
};
