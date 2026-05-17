import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

const commandName = "feedback-stats";

export function buildFeedbackStatsCommand() {
  return new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Feedback-Anzahl und Durchschnitt für ein Teammitglied einsehen.")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Teammitglied (nur mit Team-Status-Mod-Rolle)."),
    );
}

export function buildFeedbackStatsCommandPayload(): RESTPostAPIApplicationCommandsJSONBody {
  return buildFeedbackStatsCommand().toJSON();
}

export { commandName as feedbackStatsCommandName };
