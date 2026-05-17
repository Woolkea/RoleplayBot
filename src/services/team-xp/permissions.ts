import type { GuildMember } from "discord.js";

export function memberHasRoleId(member: GuildMember, roleId: string | undefined): boolean {
  if (roleId === undefined || roleId === "") {
    return false;
  }

  return member.roles.cache.has(roleId);
}

export function memberHasTeamRole(member: GuildMember, teamRoleId: string | undefined): boolean {
  return memberHasRoleId(member, teamRoleId);
}
