export type TeamlisteAdminPanelRef = {
  channelId: string;
  messageId: string;
};
const store = new Map<string, TeamlisteAdminPanelRef>();

function cacheKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function setTeamlisteAdminPanelMessage(
  guildId: string,
  userId: string,
  ref: TeamlisteAdminPanelRef,
): void {
  store.set(cacheKey(guildId, userId), ref);
}

export function getTeamlisteAdminPanelMessage(
  guildId: string,
  userId: string,
): TeamlisteAdminPanelRef | undefined {
  return store.get(cacheKey(guildId, userId));
}
