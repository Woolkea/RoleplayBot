import {
  getPreviousHistoryAuthor,
  getTeamMemberTextStatus,
  upsertTeamMemberTextStatus,
} from "@/repositories/team-member-text-status.js";

import { TeamMemberTextStatusUserFacingError } from "./team-member-text-status-user-error.js";

import { buildMyTeamTextStatusContainer } from "./ui-builders.js";

const MAX_DESCRIPTION_LENGTH = 4000;

export type MyTeamTextStatusPayload = {
  subjectUserId?: string;
  hasStatus: boolean;
  description?: string;
  setByDiscordUserId?: string;
  updatedAtUnix?: number;
  previousSetByDiscordUserId?: string;
};

export const teamMemberTextStatusService = {
  normalizeDescription(raw: string): string {
    return raw.trim();
  },
  validateDescriptionForSet(normalized: string): void {
    if (normalized.length === 0) {
      throw new TeamMemberTextStatusUserFacingError("Bitte eine Beschreibung eingeben.");
    }

    if (normalized.length > MAX_DESCRIPTION_LENGTH) {
      throw new TeamMemberTextStatusUserFacingError(
        `Die Beschreibung darf maximal ${String(MAX_DESCRIPTION_LENGTH)} Zeichen lang sein.`,
      );
    }
  },
  async setStatus(args: {
    guildId: string;
    targetUserId: string;
    actorUserId: string;
    description: string;
  }): Promise<void> {
    const normalized = teamMemberTextStatusService.normalizeDescription(args.description);
    teamMemberTextStatusService.validateDescriptionForSet(normalized);
    await upsertTeamMemberTextStatus({
      guildId: args.guildId,
      targetUserId: args.targetUserId,
      setByDiscordUserId: args.actorUserId,
      description: normalized,
    });
  },
  async buildMyStatusPayload(args: {
    guildId: string;
    viewerUserId: string;
  }): Promise<MyTeamTextStatusPayload> {
    const current = await getTeamMemberTextStatus({
      guildId: args.guildId,
      userId: args.viewerUserId,
    });

    if (current === null) {
      return { hasStatus: false };
    }

    const previous = await getPreviousHistoryAuthor({
      guildId: args.guildId,
      userId: args.viewerUserId,
    });

    return {
      hasStatus: true,
      description: current.description,
      setByDiscordUserId: current.setByDiscordUserId,
      updatedAtUnix: Math.floor(current.updatedAt.getTime() / 1000),
      previousSetByDiscordUserId: previous?.setByDiscordUserId,
    };
  },
  async buildMemberStatusPayload(args: {
    guildId: string;
    memberUserId: string;
  }): Promise<MyTeamTextStatusPayload> {
    const base = await teamMemberTextStatusService.buildMyStatusPayload({
      guildId: args.guildId,
      viewerUserId: args.memberUserId,
    });

    return { ...base, subjectUserId: args.memberUserId };
  },
  buildMyStatusContainer(payload: MyTeamTextStatusPayload) {
    return buildMyTeamTextStatusContainer(payload);
  },
};
