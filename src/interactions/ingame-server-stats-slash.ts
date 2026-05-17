import { MessageFlags, PermissionFlagsBits, type GuildMember, type Interaction } from "discord.js";

import { setCodeCommandName } from "@/commands/ingame-server-stats/set-code-command.js";

import { setOwnerCommandName } from "@/commands/ingame-server-stats/set-owner-command.js";

import { setPlayerCommandName } from "@/commands/ingame-server-stats/set-player-command.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import { loadEnv } from "@/config/env.js";

import { memberHasTeamRole } from "@/services/team-xp/permissions.js";

import { buildIngameStatsSetPlayerAckButtonCustomId } from "@/interactions/custom-ids.js";

import {
  INGAME_SERVER_STATS_MAX_PLAYERS,
  INGAME_SERVER_STATS_TEAM_XP_AMOUNT,
} from "@/services/ingame-server-stats/constants.js";

import { ingameServerStatsService } from "@/services/ingame-server-stats/ingame-server-stats-service.js";

import { IngameServerStatsUserFacingError } from "@/services/ingame-server-stats/ingame-server-stats-user-error.js";

import {
  buildIngameServerStatsSlashSuccessContainer,
  buildSetPlayerBroadcastAckContainer,
  buildSetPlayerCooldownBlockedContainer,
  ingameServerStatsV2Flags,
} from "@/services/ingame-server-stats/ui-builders.js";

function isOurCommand(name: string): boolean {
  return (
    name === setCodeCommandName || name === setPlayerCommandName || name === setOwnerCommandName
  );
}

export async function tryHandleIngameServerStatsSlash(interaction: Interaction): Promise<boolean> {
  if (!interaction.isChatInputCommand() || !isOurCommand(interaction.commandName)) {
    return false;
  }

  const cmd = interaction;

  if (cmd.guildId === null) {
    throw new IngameServerStatsUserFacingError("Nur in einer Guild verfügbar.");
  }

  await cmd.deferReply({ flags: MessageFlags.Ephemeral });
  const env = loadEnv();
  const guildId = cmd.guildId;
  const client = cmd.client;
  const at = new Date();

  if (cmd.commandName === setCodeCommandName) {
    if (!cmd.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      throw new IngameServerStatsUserFacingError(
        "Nur für Mitglieder mit Administrator-Berechtigung.",
      );
    }

    const code = cmd.options.getString("code");
    await ingameServerStatsService.setJoinCode({
      client,
      env,
      guildId,
      actorUserId: cmd.user.id,
      code,
      at,
    });
    const body =
      `${emojiToString(EMOJIS.SUCCESS)} Code aktualisiert\n` + `> Das Panel wurde angepasst.`;
    await cmd.editReply({
      flags: ingameServerStatsV2Flags(),
      components: [buildIngameServerStatsSlashSuccessContainer(body)],
    });

    return true;
  }

  const member = cmd.member as GuildMember | null;

  if (member === null) {
    throw new IngameServerStatsUserFacingError("Mitgliedsdaten fehlen.");
  }

  if (env.teamRoleId === undefined) {
    throw new IngameServerStatsUserFacingError(
      "Team-Rolle ist nicht konfiguriert (`TEAM_ROLE_ID`).",
    );
  }

  if (!memberHasTeamRole(member, env.teamRoleId)) {
    throw new IngameServerStatsUserFacingError(
      "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
    );
  }

  if (cmd.commandName === setPlayerCommandName) {
    const count = cmd.options.getInteger("count", true);

    if (!Number.isInteger(count) || count < 0 || count > INGAME_SERVER_STATS_MAX_PLAYERS) {
      throw new IngameServerStatsUserFacingError(
        `Spieleranzahl muss eine ganze Zahl zwischen 0 und ${String(INGAME_SERVER_STATS_MAX_PLAYERS)} sein.`,
      );
    }

    const blockedUntil = await ingameServerStatsService.getStatsTeamActionBlockedUntil({
      guildId,
      userId: cmd.user.id,
      at,
    });

    if (blockedUntil !== null) {
      await cmd.editReply({
        flags: ingameServerStatsV2Flags(),
        components: [buildSetPlayerCooldownBlockedContainer({ waitUntil: blockedUntil })],
      });

      return true;
    }

    const issuedAtMs = at.getTime();
    const buttonCustomId = buildIngameStatsSetPlayerAckButtonCustomId({
      guildId,
      userId: cmd.user.id,
      count,
      issuedAtMs,
    });
    await cmd.editReply({
      flags: ingameServerStatsV2Flags(),
      components: [buildSetPlayerBroadcastAckContainer({ buttonCustomId })],
    });

    return true;
  }

  if (cmd.commandName === setOwnerCommandName) {
    const text = cmd.options.getString("text", true);
    const { gained, cooldownActive } = await ingameServerStatsService.setOwnerDisplay({
      client,
      env,
      guildId,
      userId: cmd.user.id,
      text,
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

    const body = `${emojiToString(EMOJIS.SUCCESS)} Owner-Zeile aktualisiert\n${detail}`;
    await cmd.editReply({
      flags: ingameServerStatsV2Flags(),
      components: [buildIngameServerStatsSlashSuccessContainer(body)],
    });

    return true;
  }

  return false;
}
