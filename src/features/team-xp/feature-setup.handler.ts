import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import { buildTeamXpPanelContainer, teamXpV2Flags } from "@/services/team-xp/ui-builders.js";

export const teamXpFeatureSetup: FeatureSetupHandler = {
  id: "team-xp-panel",
  name: "Team-Leaderboard-Panel",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.send({
      flags: teamXpV2Flags(),
      components: [buildTeamXpPanelContainer()],
    });
    await interaction.editReply({
      content: `Team-Leaderboard-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
