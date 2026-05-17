import { adminCallFeatureSetup } from "../admin-calls/feature-setup.handler.js";

import { feedbackFeatureSetup } from "../feedback/feature-setup.handler.js";

import { ingameModerationFeatureSetup } from "../ingame-moderation/feature-setup.handler.js";

import { regelwerkFeatureSetup } from "../regelwerk/feature-setup.handler.js";

import { robloxSetupFeatureSetup } from "../roblox-setup/feature-setup.handler.js";

import { teamlisteFeatureSetup } from "../teamliste/feature-setup.handler.js";

import { teamXpFeatureSetup } from "../team-xp/feature-setup.handler.js";

import type { FeatureSetupHandler } from "./types.js";

export const featureSetupHandlers: FeatureSetupHandler[] = [
  ingameModerationFeatureSetup,
  adminCallFeatureSetup,
  feedbackFeatureSetup,
  teamXpFeatureSetup,
  teamlisteFeatureSetup,
  regelwerkFeatureSetup,
  robloxSetupFeatureSetup,
];
const maxChoices = 25;

if (featureSetupHandlers.length > maxChoices) {
  throw new Error(
    "featureSetupHandlers: max " + String(maxChoices) + " entries for slash string choices",
  );
}

export function getFeatureSetupHandler(id: string): FeatureSetupHandler | undefined {
  return featureSetupHandlers.find((h) => h.id === id);
}
