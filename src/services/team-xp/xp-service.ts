import { randomUUID } from "node:crypto";

import { loadEnv } from "@/config/env.js";

import {
  countTeamXpRows,
  deleteGlobalXpBoostById,
  expireActiveGlobalXpBoosts,
  getActiveBoostMultiplierMax,
  getAverageTeamXp,
  getLatestDizzyControlForTarget,
  getTeamXpHistory,
  getTeamXpRow,
  incrementTeamXp,
  insertDizzyControl,
  insertGlobalXpBoost,
  listActiveGlobalXpBoostsWithAnnouncements,
  listTeamXpLeaderboard,
  deleteAllTeamXpForGuild,
  setTeamMemberLastMessageAt,
  updateGlobalXpBoostAnnouncementIds,
  updateTeamXpAbsolute,
} from "@/repositories/team-xp.js";

import { getRobloxLink } from "@/repositories/roblox-links.js";

import { sendXpBoostEndedReply } from "./xp-boost-ended-reply.js";

import {
  buildXpBoostAnnouncementContainer,
  buildXpBoostRolePingTextDisplay,
} from "./xp-boost-ui-builders.js";

import {
  DEFAULT_TEAM_XP_BOOST_PING_ROLE_ID,
  DIZZY_ROBLOX_LINK_MAX_AGE_MS,
  TEAM_DIZZY_TARGET_COOLDOWN_MS,
  TEAM_DIZZY_XP_AMOUNT,
  TEAM_LEADERBOARD_PAGE_SIZE,
  TEAM_MESSAGE_XP_AMOUNT,
  TEAM_MESSAGE_XP_COOLDOWN_MS,
  TEAM_XP_BOOST_REASON_MAX_LENGTH,
} from "./constants.js";

import { TeamXpUserFacingError } from "./team-xp-user-error.js";

import {
  buildDizzyControlLogContainer,
  buildDizzyControlLogErrorContainer,
  teamXpV2Flags,
} from "./ui-builders.js";

import type { ContainerBuilder } from "@discordjs/builders";

import type { Client, GuildTextBasedChannel } from "discord.js";

import { ChannelType } from "discord.js";

async function getActiveMultiplier(guildId: string, now: Date): Promise<number> {
  return getActiveBoostMultiplierMax(guildId, now);
}

async function sendDizzyKontrolleLogMessage(args: {
  client: Client;
  logChannelId: string;
  components: ContainerBuilder[];
}): Promise<void> {
  const logCh = await args.client.channels.fetch(args.logChannelId);

  if (logCh === null || logCh.type !== ChannelType.GuildText) {
    console.error(
      "Dizzy-Kontrolle-Log: Kanal nicht gefunden oder kein Textkanal:",
      args.logChannelId,
    );

    return;
  }

  const logTextCh = logCh as GuildTextBasedChannel;
  await logTextCh.send({
    flags: teamXpV2Flags(),
    components: args.components,
    allowedMentions: { parse: [] },
  });
}

export const teamXpService = {
  async tryAwardMessageXp(args: { guildId: string; userId: string; at?: Date }): Promise<boolean> {
    const at = args.at ?? new Date();
    const nowMs = at.getTime();
    const row = await getTeamXpRow({ guildId: args.guildId, userId: args.userId });
    const last = row?.lastMessageAt?.getTime();

    if (last !== undefined && nowMs - last < TEAM_MESSAGE_XP_COOLDOWN_MS) {
      return false;
    }

    const gained = await teamXpService.addXp(args.guildId, args.userId, TEAM_MESSAGE_XP_AMOUNT, at);

    if (gained <= 0) {
      return false;
    }

    await setTeamMemberLastMessageAt({
      guildId: args.guildId,
      userId: args.userId,
      at,
    });

    return true;
  },
  async addXp(
    guildId: string,
    userId: string,
    baseAmount: number,
    now: Date = new Date(),
  ): Promise<number> {
    if (baseAmount <= 0) {
      return 0;
    }

    const mult = await getActiveMultiplier(guildId, now);
    const gained = Math.max(0, Math.floor(baseAmount * mult));

    if (gained === 0) {
      return 0;
    }

    await incrementTeamXp({ guildId, userId, delta: gained });

    return gained;
  },
  async removeXp(guildId: string, userId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      return;
    }

    const row = await getTeamXpRow({ guildId, userId });
    const cur = row?.xp ?? 0;
    await updateTeamXpAbsolute({
      guildId,
      userId,
      xp: Math.max(0, cur - amount),
    });
  },
  async getXp(guildId: string, userId: string): Promise<number> {
    const row = await getTeamXpRow({ guildId, userId });

    return row?.xp ?? 0;
  },
  async getAverageXp(guildId: string): Promise<number> {
    return getAverageTeamXp(guildId);
  },
  async getHistory(
    guildId: string,
    userId: string,
  ): Promise<{
    userHistory: {
      xp: number;
      createdAt: Date;
    }[];
    avgHistory: {
      xp: number;
      createdAt: Date;
    }[];
  }> {
    const userRows = await getTeamXpHistory(guildId, userId);
    const avgRows = await getTeamXpHistory(guildId, "AVERAGE");
    const userHistory = userRows.map((r) => ({ xp: r.xp, createdAt: r.createdAt }));
    const avgHistory = avgRows.map((r) => ({ xp: r.xp, createdAt: r.createdAt }));

    if (userHistory.length === 0) {
      const currentXp = await this.getXp(guildId, userId);
      userHistory.push({ xp: currentXp, createdAt: new Date() });
    }

    if (avgHistory.length === 0) {
      const currentAvg = await this.getAverageXp(guildId);
      avgHistory.push({ xp: currentAvg, createdAt: new Date() });
    }

    return { userHistory, avgHistory };
  },
  async getLeaderboardPage(
    guildId: string,
    page: number,
    pageSize: number = TEAM_LEADERBOARD_PAGE_SIZE,
  ): Promise<{
    entries: Array<{
      rank: number;
      userId: string;
      xp: number;
    }>;
    total: number;
    totalPages: number;
    page: number;
  }> {
    const total = await countTeamXpRows(guildId);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageClamped = Math.min(Math.max(1, page), totalPages);
    const offset = (pageClamped - 1) * pageSize;
    const rows = await listTeamXpLeaderboard({
      guildId,
      limit: pageSize,
      offset,
    });
    const entries = rows.map((r, i) => ({
      rank: offset + i + 1,
      userId: r.userId,
      xp: r.xp,
    }));

    return { entries, total, totalPages, page: pageClamped };
  },
  async resetLeaderboard(guildId: string): Promise<void> {
    await deleteAllTeamXpForGuild(guildId);
  },
  async setGlobalBoostWithAnnouncement(args: {
    client: Client;
    guildId: string;
    percent: number;
    hours: number;
    reason: string;
    setterUserId: string;
    now?: Date;
  }): Promise<{
    announcementUrl: string;
  }> {
    const now = args.now ?? new Date();

    if (args.percent < 0 || args.hours <= 0) {
      throw new TeamXpUserFacingError("Prozent und Stunden müssen positiv sein.");
    }

    const reasonTrim = args.reason.trim();

    if (reasonTrim.length === 0) {
      throw new TeamXpUserFacingError("Grund ist erforderlich.");
    }

    if (reasonTrim.length > TEAM_XP_BOOST_REASON_MAX_LENGTH) {
      throw new TeamXpUserFacingError(
        `Grund ist zu lang (max. ${String(TEAM_XP_BOOST_REASON_MAX_LENGTH)} Zeichen).`,
      );
    }

    const env = loadEnv();
    const channelId = env.teamXpBoostAnnounceChannelId;

    if (channelId === undefined) {
      throw new TeamXpUserFacingError(
        "XP-Boost-Ankündigungskanal fehlt (TEAM_XP_BOOST_ANNOUNCE_CHANNEL_ID).",
      );
    }

    const mult = 1 + args.percent / 100;
    const expiresAt = new Date(now.getTime() + args.hours * 60 * 60 * 1000);
    const bonusPercent = Math.round(args.percent);
    const boostId = await insertGlobalXpBoost({
      guildId: args.guildId,
      multiplier: mult,
      expiresAt,
      setByDiscordUserId: args.setterUserId,
      bonusPercent,
      durationHours: args.hours,
      reason: reasonTrim,
    });
    const pingRoleId =
      env.teamXpBoostPingRoleId !== undefined && env.teamXpBoostPingRoleId.trim() !== ""
        ? env.teamXpBoostPingRoleId.trim()
        : DEFAULT_TEAM_XP_BOOST_PING_ROLE_ID;
    const container = buildXpBoostAnnouncementContainer({
      percent: args.percent,
      durationHours: args.hours,
      setterUserId: args.setterUserId,
      reason: reasonTrim,
    });

    try {
      const ch = await args.client.channels.fetch(channelId);

      if (
        ch === null ||
        (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildAnnouncement)
      ) {
        throw new TeamXpUserFacingError(
          "XP-Boost-Ankündigungskanal nicht gefunden oder kein Textkanal.",
        );
      }

      const textCh = ch as GuildTextBasedChannel;
      const allowedMentions = { parse: [] as [], roles: [pingRoleId] };
      const message = await textCh.send({
        flags: teamXpV2Flags(),
        components: [buildXpBoostRolePingTextDisplay(pingRoleId), container],
        allowedMentions,
      });
      await updateGlobalXpBoostAnnouncementIds({
        id: boostId,
        announcementChannelId: message.channelId,
        announcementMessageId: message.id,
      });

      return { announcementUrl: message.url };
    } catch (err: unknown) {
      await deleteGlobalXpBoostById(boostId);

      if (err instanceof TeamXpUserFacingError) {
        throw err;
      }

      console.error("xp boost announcement send failed:", err);
      throw new TeamXpUserFacingError("Ankündigung konnte nicht gesendet werden.");
    }
  },
  async stopGlobalBoost(args: { client: Client; guildId: string; now?: Date }): Promise<number> {
    const now = args.now ?? new Date();
    const withAnn = await listActiveGlobalXpBoostsWithAnnouncements({ guildId: args.guildId, now });
    const ended = await expireActiveGlobalXpBoosts({ guildId: args.guildId, now });

    if (ended === 0) {
      throw new TeamXpUserFacingError("Es läuft kein aktiver globaler XP-Boost.");
    }

    for (const row of withAnn) {
      await sendXpBoostEndedReply(args.client, row, now);
    }

    return ended;
  },
  async processDizzyKontrolle(args: {
    client: Client;
    guildId: string;
    moderatorUserId: string;
    targetUserId: string;
  }): Promise<void> {
    const env = loadEnv();

    if (env.dizzyRobloxLinkChannelId === undefined) {
      throw new TeamXpUserFacingError(
        "Dizzy-Roblox-Verknüpfungskanal fehlt (DIZZY_ROBLOX_LINK_CHANNEL_ID).",
        {
          dizzyKontrolleLogFehler: "DIZZY_ROBLOX_LINK_CHANNEL_ID fehlt.",
        },
      );
    }

    const link = await getRobloxLink({
      guildId: args.guildId,
      discordUserId: args.targetUserId,
    });

    if (link === null) {
      throw new TeamXpUserFacingError("Dieser Spieler hat noch keine Roblox-Verknüpfung.", {
        dizzyKontrolleLogFehler: "Keine Roblox-Verknüpfung.",
      });
    }

    const linkAge = Date.now() - link.addedAt.getTime();

    if (linkAge >= DIZZY_ROBLOX_LINK_MAX_AGE_MS) {
      throw new TeamXpUserFacingError(
        "Die Roblox-Verknüpfung dieses Spielers ist älter als 30 Tage. Er muss sie im Verknüpfungskanal neu bestätigen.",
        { dizzyKontrolleLogFehler: "Verknüpfung >30 Tage." },
      );
    }

    const controlRef = randomUUID();
    const lastTargetControl = await getLatestDizzyControlForTarget({
      guildId: args.guildId,
      targetUserId: args.targetUserId,
    });

    if (lastTargetControl !== null) {
      const elapsed = Date.now() - lastTargetControl.createdAt.getTime();

      if (elapsed < TEAM_DIZZY_TARGET_COOLDOWN_MS) {
        const remainingMs = TEAM_DIZZY_TARGET_COOLDOWN_MS - elapsed;
        const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
        const sameModerator = lastTargetControl.moderatorDiscordUserId === args.moderatorUserId;

        if (sameModerator) {
          const waitHint =
            remainingMin <= 1
              ? "Bitte warte noch etwa eine Minute."
              : `Bitte warte noch etwa ${String(remainingMin)} Minuten.`;
          throw new TeamXpUserFacingError(
            `Für diesen Spieler wurde kürzlich bereits eine Dizzy-Kontrolle verbucht. ${waitHint}`,
            {
              dizzyKontrolleLogFehler:
                remainingMin <= 1
                  ? "5-Minuten-Dizzy-Cooldown für diesen Spieler aktiv (noch unter 1 Min.)."
                  : `5-Minuten-Dizzy-Cooldown für diesen Spieler aktiv (noch ca. ${String(remainingMin)} Min.).`,
            },
          );
        }

        const waitHintOther =
          remainingMin <= 1
            ? "Bitte warte noch etwa eine Minute."
            : `Bitte warte noch etwa ${String(remainingMin)} Minuten.`;
        throw new TeamXpUserFacingError(
          `Für diesen Spieler wurde kürzlich bereits eine Dizzy-Kontrolle durch ein anderes Teammitglied verbucht. ${waitHintOther}`,
          { dizzyKontrolleLogFehler: "Spieler wurde bereits kontrolliert." },
        );
      }
    }

    await insertDizzyControl({
      messageId: controlRef,
      guildId: args.guildId,
      targetUserId: args.targetUserId,
      moderatorDiscordUserId: args.moderatorUserId,
    });
    await teamXpService.addXp(args.guildId, args.moderatorUserId, TEAM_DIZZY_XP_AMOUNT);
    const logChannelId = env.dizzyControlLogChannelId;

    if (logChannelId !== undefined) {
      try {
        await sendDizzyKontrolleLogMessage({
          client: args.client,
          logChannelId,
          components: [
            buildDizzyControlLogContainer({
              moderatorUserId: args.moderatorUserId,
              targetUserId: args.targetUserId,
            }),
          ],
        });
      } catch (err) {
        console.error("Dizzy-Kontrolle-Log senden fehlgeschlagen:", err);
      }
    }
  },
  async trySendDizzyKontrolleFehlerLog(args: {
    client: Client;
    moderatorUserId: string;
    targetUserId: string;
    fehlerText: string;
  }): Promise<void> {
    const logChannelId = loadEnv().dizzyControlLogChannelId;

    if (logChannelId === undefined) {
      return;
    }

    try {
      await sendDizzyKontrolleLogMessage({
        client: args.client,
        logChannelId,
        components: [
          buildDizzyControlLogErrorContainer({
            moderatorUserId: args.moderatorUserId,
            targetUserId: args.targetUserId,
            fehlerText: args.fehlerText,
          }),
        ],
      });
    } catch (err) {
      console.error("Dizzy-Kontrolle-Fehler-Log senden fehlgeschlagen:", err);
    }
  },
};
