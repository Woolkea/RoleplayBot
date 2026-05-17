import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

import { type ServerShard } from "@/interactions/custom-ids.js";

export type IngameAction = "warn" | "kick" | "ban" | "unban";

export type IngameFlowState = {
  guildId: string;
  channelId: string;
  profile: RobloxPublicProfile;
  moderatorUserId: string;
  action: IngameAction;
  serverShard: ServerShard;
  reason: string;
  banIsPermanent: boolean;
  banDurationDays: number | null;
};
type CacheEntry = {
  state: IngameFlowState;
  expiresAtMs: number;
};
const DEFAULT_TTL_MS = 20 * 60 * 1000;

export class IngameFlowCache {
  private readonly store = new Map<string, CacheEntry>();
  set(flowId: string, state: IngameFlowState, ttlMs: number = DEFAULT_TTL_MS): void {
    this.sweepExpired();
    const expiresAtMs = Date.now() + ttlMs;
    this.store.set(flowId, { state, expiresAtMs });
  }
  get(flowId: string): IngameFlowState | undefined {
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

export const ingameFlowCache = new IngameFlowCache();
