import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

import { teamlisteService } from "@/services/teamliste/teamliste-service.js";

import {
  teamlistePanelAllowedMentions,
  teamlisteV2Flags,
} from "@/services/teamliste/ui-builders.js";

export const teamlisteFeatureSetup: FeatureSetupHandler = {
  id: "teamliste-panel",
  name: "Teamliste-Panel",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = interaction.guild;

    if (guild === null) {
      await interaction.editReply({
        content: "Dieser Befehl funktioniert nur in einer Guild.",
      });

      return;
    }

    const containers = await teamlisteService.buildPublicPanelContainers({
      client: interaction.client,
      guildId: guild.id,
    });
    const panelMessageIds: string[] = [];

    for (const container of containers) {
      const msg = await channel.send({
        flags: teamlisteV2Flags(),
        components: [container],
        allowedMentions: teamlistePanelAllowedMentions,
      });
      panelMessageIds.push(msg.id);
    }

    await teamlisteService.savePanelBinding({
      guildId: guild.id,
      channelId: channel.id,
      panelMessageIds,
    });
    await interaction.editReply({
      content: `Teamliste-Panel wurde in <#${channel.id}> gepostet.`,
    });
  },
};
