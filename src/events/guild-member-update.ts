import type { Client, GuildMember, PartialGuildMember } from "discord.js";

import { Events } from "discord.js";

import { teamlisteService } from "@/services/teamliste/teamliste-service.js";

import { TeamlisteUserFacingError } from "@/services/teamliste/teamliste-user-error.js";

export function registerGuildMemberUpdateHandler(client: Client): void {
  client.on(
    Events.GuildMemberUpdate,
    (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
      void handleGuildMemberUpdate(client, oldMember, newMember).catch((error: unknown) => {
        if (error instanceof TeamlisteUserFacingError) {
          return;
        }

        console.error("[guildMemberUpdate] Error handling event:", error);
      });
    },
  );
}

async function handleGuildMemberUpdate(
  client: Client,
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
): Promise<void> {
  const guildId = newMember.guild.id;

  if (oldMember.roles.cache.size === newMember.roles.cache.size) {
    const oldRoleIds = Array.from(oldMember.roles.cache.keys());
    const newRoleIds = Array.from(newMember.roles.cache.keys());
    const rolesChanged =
      oldRoleIds.some((id) => !newRoleIds.includes(id)) ||
      newRoleIds.some((id) => !oldRoleIds.includes(id));

    if (!rolesChanged) {
      return;
    }
  }

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

  const hadTeamRole = oldMember.roles.cache.some((_, roleId) => teamlisteRoleIds.has(roleId));
  const hasTeamRole = newMember.roles.cache.some((_, roleId) => teamlisteRoleIds.has(roleId));
  let needsRefresh = false;

  if (hadTeamRole || hasTeamRole) {
    needsRefresh = true;
  }

  if (needsRefresh) {
    await teamlisteService.refreshPanel(client, guildId);
  }
}
