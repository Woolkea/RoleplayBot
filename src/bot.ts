import { Client, GatewayIntentBits } from "discord.js";

import { loadEnv, type AppEnv } from "@/config/env.js";

import { closePool, verifyDatabaseConnection } from "@/db/client.js";

import { registerInteractionCreateHandler } from "@/events/interaction-create.js";

import { registerMessageCreateHandler } from "@/events/message-create.js";

import { registerReadyHandler } from "@/events/ready.js";

import { registerGuildMemberUpdateHandler } from "@/events/guild-member-update.js";

import { registerGuildMemberRemoveHandler } from "@/events/guild-member-remove.js";

import { registerVoiceStateUpdateHandler } from "@/events/voice-state-update.js";

function isDiscordDisallowedIntentsError(error: unknown): boolean {
  return error instanceof Error && /\bdisallowed intents\b/i.test(error.message);
}

function discordDisallowedIntentsMessage(): string {
  return ["Used disalowed intents."].join("\n");
}

export class LunarBot {
  private readonly client: Client;
  private readonly env: AppEnv;
  constructor() {
    this.env = loadEnv();
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });
    registerReadyHandler(this.client, this.env);
    registerInteractionCreateHandler(this.client);
    registerMessageCreateHandler(this.client);
    registerGuildMemberUpdateHandler(this.client);
    registerGuildMemberRemoveHandler(this.client);
    registerVoiceStateUpdateHandler(this.client);
  }
  async start(): Promise<void> {
    await verifyDatabaseConnection();

    try {
      await this.client.login(this.env.discordToken);
    } catch (error: unknown) {
      if (isDiscordDisallowedIntentsError(error)) {
        throw new Error(discordDisallowedIntentsMessage(), {
          cause: error,
        });
      }

      throw error;
    }
  }
  async stop(): Promise<void> {
    await this.client.destroy();
    await closePool();
  }
}
