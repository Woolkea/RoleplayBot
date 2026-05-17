import {
  ChannelType,
  type ButtonInteraction,
  type Client,
  type GuildMember,
  type VoiceState,
} from "discord.js";

import { loadEnv, type AppEnv } from "@/config/env.js";

import { parseOfficeRequestMoveButton } from "@/interactions/custom-ids.js";

import {
  claimOfficeRequestIfOpen,
  deleteOfficeRequestById,
  deleteOpenOfficeRequestByGuildAndRequester,
  findOpenOfficeRequestByGuildAndRequester,
  getOfficeRequestById,
  insertOfficeRequestDraft,
  revertOfficeRequestClaimAfterFailedMove,
  setOfficeRequestLogMessage,
} from "@/repositories/office-requests.js";

import { OfficeRequestUserFacingError } from "./office-request-user-error.js";

import {
  buildOfficeRequestClaimedContainer,
  buildOfficeRequestOpenContainer,
  officeRequestV2Flags,
  type OfficeRequestLogEditPayload,
} from "./ui-builders.js";

function isOfficeRequestConfigured(env: AppEnv): env is AppEnv & {
  officeRequestWaitVoiceChannelId: string;
  officeRequestLogChannelId: string;
  officeRequestStaffVoiceCategoryId: string;
} {
  return (
    env.officeRequestWaitVoiceChannelId !== undefined &&
    env.officeRequestWaitVoiceChannelId !== "" &&
    env.officeRequestLogChannelId !== undefined &&
    env.officeRequestLogChannelId !== "" &&
    env.officeRequestStaffVoiceCategoryId !== undefined &&
    env.officeRequestStaffVoiceCategoryId !== ""
  );
}

async function resolveMemberFromVoiceState(state: VoiceState): Promise<GuildMember | null> {
  return state.guild.members.fetch(state.id).catch(() => null);
}

async function handleWaitChannelJoin(args: {
  client: Client;
  env: AppEnv & {
    officeRequestWaitVoiceChannelId: string;
    officeRequestLogChannelId: string;
    officeRequestStaffVoiceCategoryId: string;
  };
  newState: VoiceState;
}): Promise<void> {
  const member = await resolveMemberFromVoiceState(args.newState);

  if (member === null || member.user.bot) {
    return;
  }

  const guildId = member.guild.id;
  const existing = await findOpenOfficeRequestByGuildAndRequester({
    guildId,
    requesterDiscordUserId: member.id,
  });

  if (existing !== undefined) {
    if (existing.logMessageId !== null && existing.logChannelId !== null) {
      return;
    }

    await deleteOfficeRequestById(existing.id);
  }

  const joinedAt = new Date();
  const requestId = await insertOfficeRequestDraft({
    guildId,
    requesterDiscordUserId: member.id,
    joinedAt,
  });

  try {
    const ch = await args.client.channels.fetch(args.env.officeRequestLogChannelId);

    if (ch === null || ch.type !== ChannelType.GuildText) {
      throw new Error("office request log channel missing or not a text channel");
    }

    const msg = await ch.send({
      flags: officeRequestV2Flags(),
      components: [
        buildOfficeRequestOpenContainer({
          requestId,
          requesterDiscordUserId: member.id,
          joinedAt,
        }),
      ],
    });
    await setOfficeRequestLogMessage({
      id: requestId,
      logChannelId: ch.id,
      logMessageId: msg.id,
    });
  } catch (err: unknown) {
    await deleteOfficeRequestById(requestId).catch(() => undefined);
    console.error("office request: failed to post log message:", err);
  }
}

async function handleWaitChannelLeave(args: {
  client: Client;
  newState: VoiceState;
}): Promise<void> {
  const deleted = await deleteOpenOfficeRequestByGuildAndRequester({
    guildId: args.newState.guild.id,
    requesterDiscordUserId: args.newState.id,
  });

  if (deleted === null) {
    return;
  }

  if (deleted.logChannelId === null || deleted.logMessageId === null) {
    return;
  }

  try {
    const ch = await args.client.channels.fetch(deleted.logChannelId);

    if (ch === null || ch.type !== ChannelType.GuildText) {
      return;
    }

    const msg = await ch.messages.fetch(deleted.logMessageId).catch(() => null);

    if (msg !== null) {
      await msg.delete().catch(() => undefined);
    }
  } catch (err: unknown) {
    console.error("office request: failed to delete log message:", err);
  }
}

export const officeRequestService = {
  async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
    client: Client,
  ): Promise<void> {
    const env = loadEnv();

    if (!isOfficeRequestConfigured(env)) {
      return;
    }

    const waitId = env.officeRequestWaitVoiceChannelId;
    const guild = newState.guild;

    if (
      env.discordGuildId !== undefined &&
      env.discordGuildId !== "" &&
      guild.id !== env.discordGuildId
    ) {
      return;
    }

    if (newState.channelId !== waitId && oldState.channelId !== waitId) {
      return;
    }

    if (newState.channelId === waitId && oldState.channelId !== waitId) {
      await handleWaitChannelJoin({ client, env, newState });
    }

    if (oldState.channelId === waitId && newState.channelId !== waitId) {
      await handleWaitChannelLeave({ client, newState });
    }
  },
  async processMoveButton(interaction: ButtonInteraction): Promise<OfficeRequestLogEditPayload> {
    const env = loadEnv();

    if (!isOfficeRequestConfigured(env)) {
      throw new OfficeRequestUserFacingError(
        "Büroanfrage ist nicht konfiguriert (Umgebungsvariablen fehlen).",
      );
    }

    const requestId = parseOfficeRequestMoveButton(interaction.customId);

    if (requestId === undefined) {
      throw new OfficeRequestUserFacingError("Ungültige Schaltfläche.");
    }

    const row = await getOfficeRequestById(requestId);

    if (row === undefined) {
      throw new OfficeRequestUserFacingError("Diese Büroanfrage existiert nicht mehr.");
    }

    if (row.status !== "open") {
      throw new OfficeRequestUserFacingError("Diese Büroanfrage wurde bereits abgeschlossen.");
    }

    if (row.logMessageId === null || row.logChannelId === null) {
      throw new OfficeRequestUserFacingError(
        "Diese Anfrage ist noch nicht bereit. Bitte den Warteraum kurz verlassen und erneut betreten.",
      );
    }

    const guildId = interaction.guildId;

    if (guildId === null || guildId !== row.guildId) {
      throw new OfficeRequestUserFacingError("Nur in der zugehörigen Guild verfügbar.");
    }

    if (interaction.message.id !== row.logMessageId) {
      throw new OfficeRequestUserFacingError("Diese Nachricht gehört nicht zu dieser Anfrage.");
    }

    const member = interaction.member;

    if (member === null || typeof member === "string") {
      throw new OfficeRequestUserFacingError("Mitgliedsdaten fehlen.");
    }

    const guildMember = member as GuildMember;
    const staffVoice = guildMember.voice.channel;

    if (staffVoice === null || staffVoice.parentId !== env.officeRequestStaffVoiceCategoryId) {
      throw new OfficeRequestUserFacingError(
        "Du musst in einem Sprachkanal in der konfigurierten Büro-Kategorie sein, um jemanden reinzumoven.",
      );
    }

    if (staffVoice.type !== ChannelType.GuildVoice) {
      throw new OfficeRequestUserFacingError("Ziel ist kein normaler Sprachkanal.");
    }

    const claimedAt = new Date();
    const claimed = await claimOfficeRequestIfOpen({
      id: requestId,
      claimedByDiscordUserId: interaction.user.id,
      claimedByDisplayName: guildMember.displayName,
      claimedAt,
    });

    if (claimed === null) {
      throw new OfficeRequestUserFacingError("Diese Büroanfrage wurde bereits übernommen.");
    }

    const guild = interaction.guild;

    if (guild === null) {
      await revertOfficeRequestClaimAfterFailedMove({
        id: requestId,
        claimedByDiscordUserId: interaction.user.id,
      });
      throw new OfficeRequestUserFacingError("Guild nicht gefunden.");
    }

    let requester: GuildMember;

    try {
      requester = await guild.members.fetch(row.requesterDiscordUserId);
    } catch {
      await revertOfficeRequestClaimAfterFailedMove({
        id: requestId,
        claimedByDiscordUserId: interaction.user.id,
      });
      throw new OfficeRequestUserFacingError(
        "Der wartende Nutzer wurde auf dem Server nicht gefunden.",
      );
    }

    if (requester.voice.channelId !== env.officeRequestWaitVoiceChannelId) {
      await revertOfficeRequestClaimAfterFailedMove({
        id: requestId,
        claimedByDiscordUserId: interaction.user.id,
      });
      throw new OfficeRequestUserFacingError("Der Spieler wartet nicht mehr im Büro-Warteraum.");
    }

    try {
      await requester.voice.setChannel(staffVoice);
    } catch (err: unknown) {
      await revertOfficeRequestClaimAfterFailedMove({
        id: requestId,
        claimedByDiscordUserId: interaction.user.id,
      });
      console.error("office request: setChannel failed:", err);
      throw new OfficeRequestUserFacingError(
        "Der Nutzer konnte nicht verschoben werden. Bitte Rechte (Move Members) und Sprachkanäle prüfen.",
      );
    }

    const claimedRow = await getOfficeRequestById(requestId);

    if (claimedRow === undefined || claimedRow.claimedAt === null) {
      throw new Error("office request: row missing after claim");
    }

    return {
      flags: officeRequestV2Flags(),
      components: [
        buildOfficeRequestClaimedContainer({
          requestId,
          requesterDiscordUserId: row.requesterDiscordUserId,
          joinedAt: row.joinedAt,
          claimedAt: claimedRow.claimedAt,
          claimerDisplayName: guildMember.displayName,
        }),
      ],
    };
  },
};
