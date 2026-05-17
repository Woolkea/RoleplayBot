import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import {
  buildIngamePanelContainer,
  ingameV2Flags,
} from "@/services/ingame-moderation/ui-builders.js";

export const ingameModerationFeatureSetup: FeatureSetupHandler = {
  id: "ingame-moderation",
  name: "Ingame-Moderation",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.send({
      flags: ingameV2Flags(),
      components: [buildIngamePanelContainer()],
    });
    await interaction.editReply({
      content: `Ingame-Moderations-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
