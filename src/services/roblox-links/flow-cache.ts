import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

export type RobloxLinkFlowState = {
  guildId: string;
  targetDiscordUserId: string;
  actorDiscordUserId: string;
  profile: RobloxPublicProfile;
};
type CacheEntry = {
  state: RobloxLinkFlowState;
  expiresAtMs: number;
};
const DEFAULT_TTL_MS = 20 * 60 * 1000;
class RobloxLinkFlowCache {
  private readonly store = new Map<string, CacheEntry>();
  set(flowId: string, state: RobloxLinkFlowState, ttlMs: number = DEFAULT_TTL_MS): void {
    this.sweepExpired();
    this.store.set(flowId, { state, expiresAtMs: Date.now() + ttlMs });
  }
  get(flowId: string): RobloxLinkFlowState | undefined {
    this.sweepExpired();
    const entry = this.store.get(flowId);

    if (entry === undefined) {
      return undefined;
    }

    if (Date.now() > entry.expiresAtMs) {
      this.store.delete(flowId);

      return undefined;
    }

    return entry.state;
  }
  delete(flowId: string): void {
    this.store.delete(flowId);
  }
  private sweepExpired(): void {
    const now = Date.now();

    for (const [key, value] of this.store.entries()) {
      if (now > value.expiresAtMs) {
        this.store.delete(key);
      }
    }
  }
}

export const robloxLinkFlowCache = new RobloxLinkFlowCache();
