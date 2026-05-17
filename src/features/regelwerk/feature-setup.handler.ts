import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import {
  buildRegelwerkPanelContainer,
  regelwerkV2Flags,
} from "@/services/regelwerk/ui-builders.js";

export const regelwerkFeatureSetup: FeatureSetupHandler = {
  id: "regelwerk-panel",
  name: "Regelwerk-Panel",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.send({
      flags: regelwerkV2Flags(),
      components: [buildRegelwerkPanelContainer()],
    });
    await interaction.editReply({
      content: `Regelwerk-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
