import { ChannelType } from "discord.js";

import type { Client } from "discord.js";

import { loadEnv } from "@/config/env.js";

import type { AppEnv } from "@/config/env.js";

import {
  DEFAULT_VOICE_XP_CATEGORY_1_ID,
  DEFAULT_VOICE_XP_CATEGORY_2_ID,
  TEAM_VOICE_XP_PER_TICK,
  VOICE_CHANNEL_PAUSE_NAME_SUBSTRING,
} from "./constants.js";

import { memberHasTeamRole } from "./permissions.js";

import { teamXpService } from "./xp-service.js";

const TICK_MS = 60000;

function resolveCategoryIds(env: AppEnv): string[] {
  const a = env.voiceXpCategory1Id ?? DEFAULT_VOICE_XP_CATEGORY_1_ID;
  const b = env.voiceXpCategory2Id ?? DEFAULT_VOICE_XP_CATEGORY_2_ID;

  return [a, b];
}

export function startTeamXpVoiceScheduler(client: Client, env: AppEnv): NodeJS.Timeout {
  const tick = (): void => {
    void runVoiceXpTick(client, env).catch((err: unknown) => {
      console.error("team XP voice tick failed:", err);
    });
  };

  tick();

  return setInterval(tick, TICK_MS);
}

async function runVoiceXpTick(client: Client, env: AppEnv): Promise<void> {
  const guildId = env.discordGuildId;

  if (guildId === undefined || guildId === "") {
    return;
  }

  const effectiveEnv = loadEnv();
  const teamRoleId = effectiveEnv.teamRoleId;

  if (teamRoleId === undefined) {
    return;
  }

  const guild = await client.guilds.fetch(guildId).catch(() => null);

  if (guild === null) {
    return;
  }

  const categoryIds = new Set(resolveCategoryIds(effectiveEnv));
  const now = new Date();

  for (const channel of guild.channels.cache.values()) {
    if (channel.type !== ChannelType.GuildVoice) {
      continue;
    }

    const parentId = channel.parentId;

    if (parentId === null || !categoryIds.has(parentId)) {
      continue;
    }

    if (channel.name.includes(VOICE_CHANNEL_PAUSE_NAME_SUBSTRING)) {
      continue;
    }

    for (const [, member] of channel.members) {
      if (member.user.bot) {
        continue;
      }

      if (!memberHasTeamRole(member, teamRoleId)) {
        continue;
      }

      await teamXpService.addXp(guild.id, member.id, TEAM_VOICE_XP_PER_TICK, now);
    }
  }
}
