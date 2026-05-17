import type { Client, GuildMember, PartialGuildMember } from "discord.js";

import { Events } from "discord.js";

import { teamlisteService } from "@/services/teamliste/teamliste-service.js";

import { TeamlisteUserFacingError } from "@/services/teamliste/teamliste-user-error.js";

export function registerGuildMemberRemoveHandler(client: Client): void {
  client.on(Events.GuildMemberRemove, (member: GuildMember | PartialGuildMember) => {
    void handleGuildMemberRemove(client, member).catch((error: unknown) => {
      if (error instanceof TeamlisteUserFacingError) {
        return;
      }

      console.error("[guildMemberRemove] Error handling event:", error);
    });
  });
}

async function handleGuildMemberRemove(
  client: Client,
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  const guildId = member.guild.id;
  const categories = await teamlisteService.listCategories(guildId);

  if (categories.length === 0) {
    return;
  }

  const teamlisteRoleIds = new Set<string>();

  for (const cat of categories) {
    for (const roleId of cat.roles) {
      teamlisteRoleIds.add(roleId);
    }
  }

  const hadTeamRole = member.roles.cache.some((_, roleId) => teamlisteRoleIds.has(roleId));

  if (hadTeamRole) {
    await teamlisteService.refreshPanel(client, guildId);
  }
}
