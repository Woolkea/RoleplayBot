import { PermissionFlagsBits, type GuildMember } from "discord.js";

export function memberIsAdministrator(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export async function canDeleteIngameLogEntry(args: {
  actor: GuildMember;
  originalModeratorUserId: string;
}): Promise<boolean> {
  if (memberIsAdministrator(args.actor)) {
    return true;
  }

  if (args.actor.id === args.originalModeratorUserId) {
    return true;
  }

  let modMember: GuildMember | null =
    args.actor.guild.members.cache.get(args.originalModeratorUserId) ?? null;

  if (modMember === null) {
    modMember = await args.actor.guild.members
      .fetch(args.originalModeratorUserId)
      .catch(() => null);
  }

  if (modMember === null) {
    return false;
  }

  return args.actor.roles.highest.position > modMember.roles.highest.position;
}
