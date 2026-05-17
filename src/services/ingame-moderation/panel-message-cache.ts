export type IngamePanelMessageRef = {
  channelId: string;
  messageId: string;
};
const store = new Map<string, IngamePanelMessageRef>();

function cacheKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function setPendingIngamePanelMessage(
  guildId: string,
  userId: string,
  ref: IngamePanelMessageRef,
): void {
  store.set(cacheKey(guildId, userId), ref);
}

export function takePendingIngamePanelMessage(
  guildId: string,
  userId: string,
): IngamePanelMessageRef | undefined {
  const key = cacheKey(guildId, userId);
  const value = store.get(key);
  store.delete(key);

  return value;
}
