import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import { buildFeedbackPanelContainer, feedbackV2Flags } from "@/services/feedback/ui-builders.js";

export const feedbackFeatureSetup: FeatureSetupHandler = {
  id: "feedback-panel",
  name: "Feedback-Panel",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.send({
      flags: feedbackV2Flags(),
      components: [buildFeedbackPanelContainer()],
    });
    await interaction.editReply({
      content: `Feedback-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
