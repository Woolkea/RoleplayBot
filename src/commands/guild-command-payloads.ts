import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { buildFeatureSetupCommandPayload } from "@/commands/feature-setup/definition.js";

import { buildFeedbackCommandPayload } from "@/commands/feedback/definition.js";

import { buildFeedbackStatsCommandPayload } from "@/commands/feedback/feedback-stats-command.js";

import { buildSetCodeCommandPayload } from "@/commands/ingame-server-stats/set-code-command.js";

import { buildSetOwnerCommandPayload } from "@/commands/ingame-server-stats/set-owner-command.js";

import { buildSetPlayerCommandPayload } from "@/commands/ingame-server-stats/set-player-command.js";

import { buildAddRobloxAccCommandPayload } from "@/commands/roblox-links/add-roblox-acc-command.js";

import { buildRemoveRobloxAccCommandPayload } from "@/commands/roblox-links/remove-roblox-acc-command.js";

import { buildRobloxAddenCommandPayload } from "@/commands/roblox-links/roblox-adden-command.js";

import { buildTeamlisteEditCommandPayload } from "@/commands/teamliste/teamliste-edit-command.js";

import { buildTeamStatusCommandPayload } from "@/commands/team-member-text-status/team-status-command.js";

import { buildDizzykontrolleCommandPayload } from "@/commands/team-xp/dizzykontrolle-command.js";

import { buildLeaderboardCommandPayload } from "@/commands/team-xp/leaderboard-command.js";

import { buildLeaderboardResetCommandPayload } from "@/commands/team-xp/leaderboard-reset-command.js";

import { buildXpAddCommandPayload } from "@/commands/team-xp/xp-add-command.js";

import { buildXpBoostCommandPayload } from "@/commands/team-xp/xp-boost-command.js";

import { buildXpBoostStopCommandPayload } from "@/commands/team-xp/xp-boost-stop-command.js";

import { buildXpRemoveCommandPayload } from "@/commands/team-xp/xp-remove-command.js";

export function buildAllGuildApplicationCommandPayloads(): RESTPostAPIApplicationCommandsJSONBody[] {
  return [
    buildFeatureSetupCommandPayload(),
    buildFeedbackCommandPayload(),
    buildFeedbackStatsCommandPayload(),
    buildTeamlisteEditCommandPayload(),
    buildTeamStatusCommandPayload(),
    buildLeaderboardCommandPayload(),
    buildDizzykontrolleCommandPayload(),
    buildXpAddCommandPayload(),
    buildXpRemoveCommandPayload(),
    buildXpBoostCommandPayload(),
    buildXpBoostStopCommandPayload(),
    buildLeaderboardResetCommandPayload(),
    buildSetCodeCommandPayload(),
    buildSetPlayerCommandPayload(),
    buildSetOwnerCommandPayload(),
    buildRobloxAddenCommandPayload(),
    buildAddRobloxAccCommandPayload(),
    buildRemoveRobloxAccCommandPayload(),
  ];
}
