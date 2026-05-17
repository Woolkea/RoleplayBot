import { type Client, type Interaction } from "discord.js";

import { routeInteraction } from "@/interactions/router.js";

import { replyUserFacingError } from "@/interactions/user-error-reply.js";

function formatUnhandledDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unbekannter Fehler.";
}

async function onInteractionCreate(interaction: Interaction): Promise<void> {
  try {
    await routeInteraction(interaction);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`interactionCreate failed: ${error.name}: ${error.message}`, error);
    } else {
      console.error("interactionCreate failed:", error);
    }

    await replyUserFacingError(interaction, formatUnhandledDetail(error));
  }
}

export function registerInteractionCreateHandler(client: Client): void {
  client.on("interactionCreate", (interaction) => {
    void onInteractionCreate(interaction);
  });
}
