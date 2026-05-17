import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import {
  buildRobloxSetupPanelContainer,
  robloxSetupV2Flags,
} from "@/services/roblox-setup/ui-builders.js";

export const robloxSetupFeatureSetup: FeatureSetupHandler = {
  id: "roblox-setup-panel",
  name: "Roblox-Setup",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.send({
      flags: robloxSetupV2Flags(),
      components: [buildRobloxSetupPanelContainer()],
    });
    await interaction.editReply({
      content: `Roblox-Setup-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
