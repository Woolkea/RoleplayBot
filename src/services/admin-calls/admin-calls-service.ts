import { ChannelType, type Client } from "discord.js";

import { randomUUID } from "node:crypto";

import { loadEnv } from "@/config/env.js";

import { RobloxUserNotFoundError } from "@/integrations/roblox/errors.js";

import { resolveRobloxPublicProfileByUsername } from "@/integrations/roblox/users.js";

import type { ServerShard } from "@/interactions/custom-ids.js";

import {
  claimAdminCall,
  deleteAdminCall,
  getAdminCall,
  insertAdminCall,
} from "@/repositories/admin-calls.js";

import { teamXpService } from "@/services/team-xp/xp-service.js";

import { AdminCallUserFacingError } from "./admin-call-user-error.js";

import { ADMIN_CALL_CLAIM_XP_AMOUNT } from "./constants.js";

import { adminCallFlowCache } from "./flow-cache.js";

import {
  adminCallV2Flags,
  buildAdminCallLogPayload,
  buildAdminCallPreviewContainer,
  formatAdminCallServerLabel,
  type AdminCallLogPayload,
} from "./ui-builders.js";

function parseStoredServerShard(value: string): ServerShard {
  if (value === "s1" || value === "s2") {
    return value;
  }

  return "s1";
}

export const adminCallsService = {
  async processModalSubmit(args: {
    guildId: string;
    authorDiscordUserId: string;
    serverShard: ServerShard;
    robloxUsername: string;
    location: string;
    reason: string;
  }): Promise<{
    flowId: string;
    previewContainer: ReturnType<typeof buildAdminCallPreviewContainer>;
  }> {
    const trimmedUser = args.robloxUsername.trim();

    if (trimmedUser.length < 2) {
      throw new AdminCallUserFacingError("Gib einen Roblox-Namen ein.");
    }

    const loc = args.location.trim();

    if (loc.length === 0) {
      throw new AdminCallUserFacingError("Gib einen Ort ein.");
    }

    const reason = args.reason.trim();

    if (reason.length === 0) {
      throw new AdminCallUserFacingError("Gib einen Grund ein.");
    }

    let profile;

    try {
      profile = await resolveRobloxPublicProfileByUsername(trimmedUser);
    } catch (e: unknown) {
      if (e instanceof RobloxUserNotFoundError) {
        throw new AdminCallUserFacingError("Roblox-Benutzer nicht gefunden.");
      }

      throw e;
    }

    const flowId = randomUUID();
    adminCallFlowCache.set(flowId, {
      guildId: args.guildId,
      authorDiscordUserId: args.authorDiscordUserId,
      serverShard: args.serverShard,
      profile,
      location: loc,
      reason,
    });
    const previewContainer = buildAdminCallPreviewContainer({
      flowId,
      profile,
      serverLabel: formatAdminCallServerLabel(args.serverShard),
      location: loc,
      reason,
    });

    return { flowId, previewContainer };
  },
  async confirmCall(args: { flowId: string; interactionUserId: string; client: Client }): Promise<{
    logPayload: AdminCallLogPayload;
    callId: number;
  }> {
    const state = adminCallFlowCache.get(args.flowId);

    if (state === undefined) {
      throw new AdminCallUserFacingError("Vorschau abgelaufen. Bitte neu starten.");
    }

    if (state.authorDiscordUserId !== args.interactionUserId) {
      throw new AdminCallUserFacingError("Nur der Absender darf bestätigen.");
    }

    const env = loadEnv();
    const channelId = env.adminCallChannelId;

    if (channelId === undefined) {
      throw new AdminCallUserFacingError("Admin-Call-Kanal nicht konfiguriert.");
    }

    const callId = await insertAdminCall({
      guildId: state.guildId,
      authorDiscordUserId: state.authorDiscordUserId,
      robloxUserId: state.profile.id,
      robloxUsername: state.profile.name,
      robloxDisplayName: state.profile.displayName,
      robloxAvatarUrl: state.profile.headshotUrl,
      serverShard: state.serverShard,
      location: state.location,
      reason: state.reason,
    });
    const logPayload = buildAdminCallLogPayload({
      callId,
      authorDiscordUserId: state.authorDiscordUserId,
      robloxUserId: state.profile.id,
      robloxAvatarUrl: state.profile.headshotUrl,
      serverLabel: formatAdminCallServerLabel(state.serverShard),
      robloxDisplayName: state.profile.displayName,
      robloxUsername: state.profile.name,
      location: state.location,
      reason: state.reason,
      status: "open",
      claimedByDiscordUserId: null,
      pingRoleId: env.adminCallPingRoleId,
    });
    const ch = await args.client.channels.fetch(channelId);

    if (ch === null || ch.type !== ChannelType.GuildText) {
      await deleteAdminCall(callId).catch(() => undefined);
      throw new AdminCallUserFacingError("Admin-Call-Kanal ungültig.");
    }

    try {
      await ch.send({
        flags: adminCallV2Flags(),
        components: logPayload.components,
      });
    } catch (err: unknown) {
      await deleteAdminCall(callId).catch((rollbackErr: unknown) => {
        console.error("Admin-Call Rallback fehlgeschlagen:", rollbackErr);
      });
      console.error("Admin-Call Log senden fehlgeschlagen:", err);
      throw new AdminCallUserFacingError("Log konnte nicht gesendet werden.");
    }

    adminCallFlowCache.delete(args.flowId);

    return { logPayload, callId };
  },
  async claimCall(args: {
    callId: number;
    guildId: string;
    claimerDiscordUserId: string;
    claimerDisplayName: string;
  }): Promise<AdminCallLogPayload> {
    const updated = await claimAdminCall({
      callId: args.callId,
      claimedByUserId: args.claimerDiscordUserId,
    });

    if (updated === null) {
      throw new AdminCallUserFacingError("Admin Call bereits übernommen.");
    }

    await teamXpService.addXp(args.guildId, args.claimerDiscordUserId, ADMIN_CALL_CLAIM_XP_AMOUNT);
    const row = await getAdminCall(args.callId);

    if (row === undefined) {
      throw new Error("claimCall: Zeile nach Anspruch fehlt");
    }

    return buildAdminCallLogPayload({
      callId: row.id,
      authorDiscordUserId: row.authorDiscordUserId,
      robloxUserId: row.robloxUserId,
      robloxAvatarUrl: row.robloxAvatarUrl,
      serverLabel: formatAdminCallServerLabel(parseStoredServerShard(row.serverShard)),
      robloxDisplayName: row.robloxDisplayName,
      robloxUsername: row.robloxUsername,
      location: row.location,
      reason: row.reason,
      status: row.status === "claimed" ? "claimed" : "open",
      claimedByDiscordUserId: row.claimedByDiscordUserId ?? null,
      claimedByDisplayName: args.claimerDisplayName,
    });
  },
};
