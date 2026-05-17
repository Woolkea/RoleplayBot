import { randomUUID } from "node:crypto";

import type { ContainerBuilder } from "@discordjs/builders";

import { loadEnv } from "@/config/env.js";

import {
  resolveRobloxPublicProfileByUsername,
  fetchRobloxPublicProfile,
} from "@/integrations/roblox/users.js";

import {
  deleteIngameModerationEntryById,
  getIngameModerationEntryById,
  insertIngameModerationEntry,
  listIngameModerationEntriesByTarget,
  type IngameModerationEntryRow,
} from "@/repositories/ingame-moderation-entries.js";

import { IngameUserFacingError } from "@/services/ingame-moderation/ingame-user-error.js";

import type { IngameAction, IngameFlowState } from "./flow-cache.js";

import { type ServerShard } from "@/interactions/custom-ids.js";

import { ingameFlowCache } from "./flow-cache.js";

import {
  buildHistoryContainers,
  buildLogContainer,
  formatHistoryEntry,
  formatPunishmentLineLog,
  logTitleForAction,
} from "./ui-builders.js";

import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

export const ingameModerationService = {
  async getModerationEntryById(entryId: number): Promise<IngameModerationEntryRow | undefined> {
    return getIngameModerationEntryById(entryId);
  },
  async removeInsertedEntry(entryId: number): Promise<void> {
    await deleteIngameModerationEntryById(entryId);
  },
  async processModerationModalSubmit(args: {
    guildId: string;
    moderatorUserId: string;
    serverShard: ServerShard;
    username: string;
    reason: string;
    action: IngameAction;
    banIsPermanent: boolean;
    banDurationDays: number | null;
  }): Promise<{
    flowId: string;
    profile: RobloxPublicProfile;
  }> {
    const profile = await resolveRobloxPublicProfileByUsername(args.username);
    const flowId = randomUUID();
    const state: IngameFlowState = {
      guildId: args.guildId,
      channelId: "",
      profile,
      moderatorUserId: args.moderatorUserId,
      action: args.action,
      serverShard: args.serverShard,
      reason: args.reason,
      banIsPermanent: args.banIsPermanent,
      banDurationDays: args.banDurationDays,
    };
    ingameFlowCache.set(flowId, state);

    return { flowId, profile };
  },
  async getHistoryContainers(args: { guildId: string; username: string }): Promise<{
    profile: RobloxPublicProfile;
    containers: ContainerBuilder[];
  }> {
    const profile = await resolveRobloxPublicProfileByUsername(args.username);
    const [s1, s2] = await Promise.all([
      listIngameModerationEntriesByTarget({
        guildId: args.guildId,
        serverShard: "s1",
        targetRobloxUserId: profile.id,
      }),
      listIngameModerationEntriesByTarget({
        guildId: args.guildId,
        serverShard: "s2",
        targetRobloxUserId: profile.id,
      }),
    ]);
    const mapEntry = (row: (typeof s1)[number]) => ({
      entryId: row.id,
      content: formatHistoryEntry({
        createdAt: row.createdAt,
        action: row.action as IngameAction,
        reason: row.reason,
        moderatorDiscordUserId: row.moderatorDiscordUserId,
        banIsPermanent: row.isPermanent,
        banDurationDays: row.durationDays,
      }),
    });
    const containers = buildHistoryContainers({
      profile,
      server1Entries: s1.map(mapEntry),
      server2Entries: s2.map(mapEntry),
      s1Page: 1,
      s2Page: 1,
    });

    return { profile, containers };
  },
  async getHistoryPageContainers(args: {
    guildId: string;
    robloxUserId: string;
    s1Page: number;
    s2Page: number;
  }): Promise<ContainerBuilder[]> {
    const profile = await fetchRobloxPublicProfile(args.robloxUserId);
    const [s1, s2] = await Promise.all([
      listIngameModerationEntriesByTarget({
        guildId: args.guildId,
        serverShard: "s1",
        targetRobloxUserId: profile.id,
      }),
      listIngameModerationEntriesByTarget({
        guildId: args.guildId,
        serverShard: "s2",
        targetRobloxUserId: profile.id,
      }),
    ]);
    const mapEntry = (row: (typeof s1)[number]) => ({
      entryId: row.id,
      content: formatHistoryEntry({
        createdAt: row.createdAt,
        action: row.action as IngameAction,
        reason: row.reason,
        moderatorDiscordUserId: row.moderatorDiscordUserId,
        banIsPermanent: row.isPermanent,
        banDurationDays: row.durationDays,
      }),
    });

    return buildHistoryContainers({
      profile,
      server1Entries: s1.map(mapEntry),
      server2Entries: s2.map(mapEntry),
      s1Page: args.s1Page,
      s2Page: args.s2Page,
    });
  },
  async confirmModeration(flowId: string): Promise<{
    logChannelId: string;
    logContainer: ContainerBuilder;
    entryId: number;
  }> {
    const state = ingameFlowCache.get(flowId);

    if (state === undefined) {
      throw new IngameUserFacingError(
        "Diese Bestätigung ist abgelaufen (Flow abgelaufen oder Bot neu gestartet).",
      );
    }

    const env = loadEnv();
    const logChannelId =
      state.serverShard === "s1" ? env.ingameLogsServer1ChannelId : env.ingameLogsServer2ChannelId;

    if (logChannelId === undefined) {
      ingameFlowCache.delete(flowId);
      throw new IngameUserFacingError(
        "Log-Kanal fehlt in .env (INGAME_LOGS_SERVER_1_CHANNEL_ID / INGAME_LOGS_SERVER_2_CHANNEL_ID).",
      );
    }

    let isPermanent = false;
    let durationDays: number | null = null;

    if (state.action === "ban") {
      isPermanent = state.banIsPermanent;
      durationDays = state.banIsPermanent ? null : state.banDurationDays;
    }

    const entryId = await insertIngameModerationEntry({
      guildId: state.guildId,
      serverShard: state.serverShard,
      targetRobloxUserId: state.profile.id,
      targetDisplayName: state.profile.displayName,
      targetUsername: state.profile.name,
      moderatorDiscordUserId: state.moderatorUserId,
      action: state.action,
      durationDays,
      isPermanent,
      reason: state.reason,
    });
    const punishmentLine = formatPunishmentLineLog({
      action: state.action,
      banIsPermanent: state.action === "ban" ? state.banIsPermanent : false,
      banDurationDays: state.action === "ban" ? state.banDurationDays : null,
    });
    const title = logTitleForAction(
      state.action,
      state.action === "ban" ? state.banIsPermanent : false,
    );
    const logContainer = buildLogContainer({
      entryId,
      title,
      profile: state.profile,
      moderatorMention: `<@${state.moderatorUserId}>`,
      punishmentLine,
      reason: state.reason,
    });
    ingameFlowCache.delete(flowId);

    return { logChannelId, logContainer, entryId };
  },
  async deleteLogEntry(args: {
    entryId: number;
    actorId: string;
    guildId: string;
    isLogChannel: boolean;
  }): Promise<{
    deleted: boolean;
    refreshContainers?: ContainerBuilder[];
    profile?: RobloxPublicProfile;
  }> {
    const row = await getIngameModerationEntryById(args.entryId);

    if (row === undefined) {
      throw new IngameUserFacingError("Eintrag nicht gefunden.");
    }

    await deleteIngameModerationEntryById(args.entryId);

    if (args.isLogChannel) {
      return { deleted: true };
    }

    const [s1, s2] = await Promise.all([
      listIngameModerationEntriesByTarget({
        guildId: args.guildId,
        serverShard: "s1",
        targetRobloxUserId: row.targetRobloxUserId,
      }),
      listIngameModerationEntriesByTarget({
        guildId: args.guildId,
        serverShard: "s2",
        targetRobloxUserId: row.targetRobloxUserId,
      }),
    ]);
    const profile = await fetchRobloxPublicProfile(row.targetRobloxUserId);
    const mapEntry = (r: (typeof s1)[number]) => ({
      entryId: r.id,
      content: formatHistoryEntry({
        createdAt: r.createdAt,
        action: r.action as IngameAction,
        reason: r.reason,
        moderatorDiscordUserId: r.moderatorDiscordUserId,
        banIsPermanent: r.isPermanent,
        banDurationDays: r.durationDays,
      }),
    });
    const containers = buildHistoryContainers({
      profile,
      server1Entries: s1.map(mapEntry),
      server2Entries: s2.map(mapEntry),
      s1Page: 1,
      s2Page: 1,
    });

    return { deleted: true, refreshContainers: containers, profile };
  },
};
