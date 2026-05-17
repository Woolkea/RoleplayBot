import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

const commandName = "feedback";

export function buildFeedbackCommand(): SlashCommandBuilder {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Gib Feedback für ein Teammitglied.");
}

export function buildFeedbackCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildFeedbackCommand().toJSON();
}

export { commandName as feedbackCommandName };
