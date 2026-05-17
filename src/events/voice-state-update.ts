import type { Client } from "discord.js";

import { Events } from "discord.js";

import { officeRequestService } from "@/services/office-request/office-request-service.js";

export function registerVoiceStateUpdateHandler(client: Client): void {
  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    void officeRequestService
      .handleVoiceStateUpdate(oldState, newState, client)
      .catch((error: unknown) => {
        console.error("[voiceStateUpdate] Error handling office request / voice state:", error);
      });
  });
}
