import { type ButtonInteraction, type GuildMember } from "discord.js";

import { loadEnv } from "@/config/env.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { parseIngameStatsSetPlayerAckButtonCustomId } from "@/interactions/custom-ids.js";

import {
  INGAME_SERVER_STATS_MAX_PLAYERS,
  INGAME_SERVER_STATS_SET_PLAYER_ACK_TTL_MS,
  INGAME_SERVER_STATS_TEAM_XP_AMOUNT,
} from "@/services/ingame-server-stats/constants.js";

import { ingameServerStatsService } from "@/services/ingame-server-stats/ingame-server-stats-service.js";

import { IngameServerStatsUserFacingError } from "@/services/ingame-server-stats/ingame-server-stats-user-error.js";

import {
  buildIngameServerStatsSlashSuccessContainer,
  buildSetPlayerCooldownBlockedContainer,
  buildSetPlayerDiscordRateLimitContainer,
  ingameServerStatsV2Flags,
} from "@/services/ingame-server-stats/ui-builders.js";

import { memberHasTeamRole } from "@/services/team-xp/permissions.js";

function discord429RetryUntil(error: unknown): Date | undefined {
  if (error === null || typeof error !== "object") {
    return undefined;
  }

  const o = error as {
    status?: number;
    code?: number;
    data?: {
      retry_after?: number;
    };
    rawError?: {
      retry_after?: number;
    };
    body?: {
      retry_after?: unknown;
    };
  };
  const status = o.status;
  const code = o.code;

  if (status !== 429 && code !== 429) {
    return undefined;
  }

  const fromBody = o.body?.retry_after;
  const ra =
    (typeof fromBody === "number" ? fromBody : undefined) ??
    (typeof o.data?.retry_after === "number" ? o.data.retry_after : undefined) ??
    (typeof o.rawError?.retry_after === "number" ? o.rawError.retry_after : undefined);
  const sec = typeof ra === "number" && Number.isFinite(ra) ? Math.max(0.5, ra) : 2;

  return new Date(Date.now() + Math.ceil(sec * 1000));
}

export async function tryHandleIngameStatsSetPlayerAckButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const parsed = parseIngameStatsSetPlayerAckButtonCustomId(interaction.customId);

  if (parsed === undefined) {
    return false;
  }

  if (interaction.guildId === null) {
    throw new IngameServerStatsUserFacingError("Nur in einer Guild verfügbar.");
  }

  if (interaction.user.id !== parsed.userId) {
    throw new IngameServerStatsUserFacingError("Dieser Button gehört dir nicht.");
  }

  if (Date.now() - parsed.issuedAtMs > INGAME_SERVER_STATS_SET_PLAYER_ACK_TTL_MS) {
    throw new IngameServerStatsUserFacingError(
      "Die Bestätigung ist abgelaufen. Bitte /set-player erneut ausführen.",
    );
  }

  if (
    !Number.isInteger(parsed.count) ||
    parsed.count < 0 ||
    parsed.count > INGAME_SERVER_STATS_MAX_PLAYERS
  ) {
    throw new IngameServerStatsUserFacingError("Ungültige Spieleranzahl im Button.");
  }

  await interaction.deferUpdate();
  const guildId = interaction.guildId;
  const env = loadEnv();
  const member = interaction.member as GuildMember | null;

  if (member === null) {
    throw new IngameServerStatsUserFacingError("Mitgliedsdaten fehlen.");
  }

  if (env.teamRoleId === undefined || !memberHasTeamRole(member, env.teamRoleId)) {
    throw new IngameServerStatsUserFacingError("Keine Team-Rolle — Aktion abgebrochen.");
  }

  const at = new Date();
  const blockedUntil = await ingameServerStatsService.getStatsTeamActionBlockedUntil({
    guildId,
    userId: parsed.userId,
    at,
  });

  if (blockedUntil !== null) {
    await interaction.editReply({
      flags: ingameServerStatsV2Flags(),
      components: [buildSetPlayerCooldownBlockedContainer({ waitUntil: blockedUntil })],
    });

    return true;
  }

  try {
    const { gained, cooldownActive } = await ingameServerStatsService.setPlayers({
      client: interaction.client,
      env,
      guildId,
      userId: parsed.userId,
      count: parsed.count,
      at,
    });
    let detail = "> Das Panel wurde angepasst.";

    if (cooldownActive) {
      detail =
        "> Das Panel wurde angepasst. **Keine** zusätzlichen XP, da der Cooldown noch aktiv ist.";
    } else if (gained > 0) {
      detail =
        `> Das Panel wurde angepasst.\n` +
        `> **+${String(gained)}** Team-XP (Basis ${String(INGAME_SERVER_STATS_TEAM_XP_AMOUNT)}, inkl. Boost).`;
    }

    const body = `${emojiToString(EMOJIS.SUCCESS)} Spieleranzahl aktualisiert\n${detail}`;
    await interaction.editReply({
      flags: ingameServerStatsV2Flags(),
      components: [buildIngameServerStatsSlashSuccessContainer(body)],
    });
  } catch (error: unknown) {
    const retryAt = discord429RetryUntil(error);

    if (retryAt !== undefined) {
      await interaction.editReply({
        flags: ingameServerStatsV2Flags(),
        components: [buildSetPlayerDiscordRateLimitContainer({ waitUntil: retryAt })],
      });

      return true;
    }

    throw error;
  }

  return true;
}
