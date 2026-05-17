import type { ChatInputCommandInteraction, GuildTextBasedChannel } from "discord.js";

export type FeatureSetupContext = {
  interaction: ChatInputCommandInteraction;
  channel: GuildTextBasedChannel;
};

export type FeatureSetupHandler = {
  id: string;
  name: string;
  execute: (ctx: FeatureSetupContext) => Promise<void>;
};
