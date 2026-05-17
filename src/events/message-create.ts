import type { Client, Message } from "discord.js";

import { Events } from "discord.js";

import { loadEnv } from "@/config/env.js";

import { handleDizzyRobloxLinkChannelMessage } from "@/services/team-xp/dizzy-roblox-flow.service.js";

import { memberHasTeamRole } from "@/services/team-xp/permissions.js";

import { teamXpService } from "@/services/team-xp/xp-service.js";

export function registerMessageCreateHandler(client: Client): void {
  client.on(Events.MessageCreate, (message) => {
    void handleMessageCreate(message).catch((err: unknown) => {
      console.error("messageCreate (team XP) failed:", err);
    });
  });
}

async function handleMessageCreate(message: Message): Promise<void> {
  if (!message.inGuild()) {
    return;
  }

  if (message.author.bot) {
    return;
  }

  const env = loadEnv();
  const linkChannelId = env.dizzyRobloxLinkChannelId;

  if (linkChannelId !== undefined && message.channelId === linkChannelId) {
    await handleDizzyRobloxLinkChannelMessage(message);

    return;
  }

  const teamRoleId = env.teamRoleId;

  if (teamRoleId === undefined) {
    return;
  }

  const member = message.member;

  if (member === null) {
    return;
  }

  if (!memberHasTeamRole(member, teamRoleId)) {
    return;
  }

  const guildId = message.guild.id;
  const userId = message.author.id;
  const at = new Date();
  await teamXpService.tryAwardMessageXp({ guildId, userId, at });
}
