import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import {
  adminCallV2Flags,
  buildAdminCallPanelContainer,
} from "@/services/admin-calls/ui-builders.js";

export const adminCallFeatureSetup: FeatureSetupHandler = {
  id: "admin-call-panel",
  name: "Admin-Call-Panel",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.send({
      flags: adminCallV2Flags(),
      components: [buildAdminCallPanelContainer()],
    });
    await interaction.editReply({
      content: `Admin-Call-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
