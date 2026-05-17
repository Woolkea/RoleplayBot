import { MessageFlags } from "discord.js";

import type { FeatureSetupContext, FeatureSetupHandler } from "../feature-setup/types.js";

export const ticketSystemFeatureSetup: FeatureSetupHandler = {
  id: "ticket-system",
  name: "Ticket-System",
  async execute({ interaction, channel }: FeatureSetupContext) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply({
      content: `Stub **Ticket-System**: Zielkanal <#${channel.id}>. (Panel + Speicherung folgen.)`,
    });
  },
};
