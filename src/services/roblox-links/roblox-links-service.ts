import { randomUUID } from "node:crypto";

import type { Client } from "discord.js";

import { RobloxUserNotFoundError } from "@/integrations/roblox/errors.js";

import { resolveRobloxPublicProfileByUsername } from "@/integrations/roblox/users.js";

import { deleteRobloxLink, upsertRobloxLink } from "@/repositories/roblox-links.js";

import { robloxLinkFlowCache } from "./flow-cache.js";

import type { RobloxLinkFlowState } from "./flow-cache.js";

import { RobloxLinkUserFacingError } from "./roblox-link-user-error.js";

import { teamlisteService } from "../teamliste/teamliste-service.js";

export const robloxLinksService = {
  async resolveProfileAndCacheFlow(args: {
    guildId: string;
    actorDiscordUserId: string;
    targetDiscordUserId: string;
    robloxUsername: string;
  }): Promise<{
    flowId: string;
    state: RobloxLinkFlowState;
  }> {
    const trimmed = args.robloxUsername.trim();

    if (trimmed === "") {
      throw new RobloxLinkUserFacingError("Bitte einen Roblox-Benutzernamen angeben.");
    }

    let profile;

    try {
      profile = await resolveRobloxPublicProfileByUsername(trimmed);
    } catch (e: unknown) {
      if (e instanceof RobloxUserNotFoundError) {
        throw new RobloxLinkUserFacingError(`Roblox-User **${trimmed}** wurde nicht gefunden.`);
      }

      throw e;
    }

    const flowId = randomUUID();
    const state: RobloxLinkFlowState = {
      guildId: args.guildId,
      targetDiscordUserId: args.targetDiscordUserId,
      actorDiscordUserId: args.actorDiscordUserId,
      profile,
    };
    robloxLinkFlowCache.set(flowId, state);

    return { flowId, state };
  },
  async confirmLink(args: {
    flowId: string;
    interactionUserId: string;
    client: Client;
  }): Promise<void> {
    const state = robloxLinkFlowCache.get(args.flowId);

    if (state === undefined) {
      throw new RobloxLinkUserFacingError(
        "Diese Bestätigung ist abgelaufen oder ungültig. Bitte erneut starten.",
      );
    }

    if (state.actorDiscordUserId !== args.interactionUserId) {
      throw new RobloxLinkUserFacingError(
        "Nur der Nutzer, der den Vorgang gestartet hat, kann bestätigen.",
      );
    }

    await upsertRobloxLink({
      guildId: state.guildId,
      discordUserId: state.targetDiscordUserId,
      robloxUserId: state.profile.id,
      robloxUsername: state.profile.name,
      robloxDisplayName: state.profile.displayName,
      robloxAvatarUrl: state.profile.headshotUrl,
      robloxCreatedAt: state.profile.created,
    });
    robloxLinkFlowCache.delete(args.flowId);

    try {
      await teamlisteService.refreshPanel(args.client, state.guildId);
    } catch (err: unknown) {
      console.error("[robloxLinks] teamliste refresh after link failed:", err);
    }
  },
  async removeLink(args: {
    guildId: string;
    targetDiscordUserId: string;
    client: Client;
  }): Promise<boolean> {
    const removed = await deleteRobloxLink({
      guildId: args.guildId,
      discordUserId: args.targetDiscordUserId,
    });

    if (removed) {
      try {
        await teamlisteService.refreshPanel(args.client, args.guildId);
      } catch (err: unknown) {
        console.error("[robloxLinks] teamliste refresh after unlink failed:", err);
      }
    }

    return removed;
  },
};
