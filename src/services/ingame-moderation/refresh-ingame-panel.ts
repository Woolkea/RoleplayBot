import type { Client } from "discord.js";

import { takePendingIngamePanelMessage } from "./panel-message-cache.js";

import { buildIngamePanelContainer, ingameV2Flags } from "./ui-builders.js";

export async function refreshIngamePanelMessage(
  client: Client,
  guildId: string,
  userId: string,
): Promise<void> {
  const ref = takePendingIngamePanelMessage(guildId, userId);

  if (ref === undefined) {
    return;
  }

  try {
    const channel = await client.channels.fetch(ref.channelId);

    if (channel === null || !channel.isTextBased()) {
      return;
    }

    const message = await channel.messages.fetch(ref.messageId);
    await message.edit({
      flags: ingameV2Flags(),
      components: [buildIngamePanelContainer()],
    });
  } catch (error: unknown) {
    console.error("Ingame-Panel konnte nicht aktualisiert werden:", error);
  }
}
