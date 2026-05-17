import {
  ChannelType,
  MessageFlags,
  type ButtonInteraction,
  type GuildMember,
  type GuildTextBasedChannel,
} from "discord.js";

import { loadEnv } from "@/config/env.js";

import {
  parseDizzyAbuseReportButton,
  parseDizzyAbuseRevertButton,
} from "@/interactions/custom-ids.js";

import { buildUserFacingErrorContainer } from "@/interactions/user-error-reply.js";

import {
  revertDizzyAbusePenalty,
  submitDizzyControlReport,
  updateDizzyAbusePenaltyAnnouncement,
} from "@/repositories/team-xp-dizzy-abuse.js";

import { memberIsAdministrator } from "@/services/ingame-moderation/permissions.js";

import {
  buildDizzyAbusePenaltyAnnouncementContainer,
  buildDizzyAbusePenaltyRevertedContainer,
  buildDizzyAbuseReportThanksContainer,
  dizzyAbuseV2Flags,
} from "./dizzy-abuse-ui.js";

import { memberHasTeamRole } from "./permissions.js";

function reportEphemeralFlags(): number {
  return MessageFlags.Ephemeral | dizzyAbuseV2Flags();
}

async function editReplyEphemeralError(
  interaction: ButtonInteraction,
  detail: string,
): Promise<void> {
  await interaction.editReply({
    flags: reportEphemeralFlags(),
    components: [buildUserFacingErrorContainer(detail)],
  });
}

export async function handleDizzyAbuseReportAfterDefer(
  interaction: ButtonInteraction,
): Promise<void> {
  const env = loadEnv();

  if (interaction.guildId === null) {
    await editReplyEphemeralError(interaction, "Nur in einer Guild verfügbar.");

    return;
  }

  const rawMember = interaction.member;

  if (rawMember === null || typeof rawMember === "string") {
    await editReplyEphemeralError(interaction, "Mitgliedsdaten fehlen.");

    return;
  }

  const guildMember = rawMember as GuildMember;

  if (!memberHasTeamRole(guildMember, env.teamRoleId)) {
    await editReplyEphemeralError(
      interaction,
      "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
    );

    return;
  }

  const dizzyControlMessageId = parseDizzyAbuseReportButton(interaction.customId);

  if (dizzyControlMessageId === undefined) {
    await editReplyEphemeralError(interaction, "Ungültige Schaltfläche.");

    return;
  }

  const result = await submitDizzyControlReport({
    dizzyControlMessageId,
    reporterDiscordUserId: interaction.user.id,
    now: new Date(),
  });

  switch (result.outcome) {
    case "not_found":
      await editReplyEphemeralError(interaction, "Diese Dizzy-Kontrolle wurde nicht gefunden.");

      return;
    case "self_report":
      await editReplyEphemeralError(
        interaction,
        "Du kannst deine eigene Dizzy-Kontrolle nicht melden.",
      );

      return;
    case "duplicate":
      await editReplyEphemeralError(interaction, "Du hast diese Kontrolle bereits gemeldet.");

      return;
    case "recorded":
      await interaction.editReply({
        flags: reportEphemeralFlags(),
        components: [buildDizzyAbuseReportThanksContainer()],
      });

      return;

    case "penalized": {
      const announceChannelId = env.dizzyAbuseAnnounceChannelId ?? env.dizzyControlLogChannelId;

      if (announceChannelId === undefined) {
        console.error(
          "Dizzy-Abuse: kein Ankündigungskanal — setze DIZZY_ABUSE_ANNOUNCE_CHANNEL_ID oder DIZZY_CONTROL_LOG_CHANNEL_ID.",
        );
      } else {
        try {
          const ch = await interaction.client.channels.fetch(announceChannelId);

          if (ch === null || ch.type !== ChannelType.GuildText) {
            console.error(
              "Dizzy-Abuse: Ankündigungskanal nicht gefunden oder kein Textkanal:",
              announceChannelId,
            );
          } else {
            const textCh = ch as GuildTextBasedChannel;
            const container = buildDizzyAbusePenaltyAnnouncementContainer({
              moderatorUserId: result.moderatorUserId,
              reporterUserIds: result.reporterUserIds,
              xpBefore: result.xpBefore,
              xpAfter: result.xpAfter,
              penaltyId: result.penaltyId,
            });
            const msg = await textCh.send({
              flags: dizzyAbuseV2Flags(),
              components: [container],
              allowedMentions: { parse: [] },
            });
            await updateDizzyAbusePenaltyAnnouncement({
              penaltyId: result.penaltyId,
              announcementChannelId: msg.channelId,
              announcementMessageId: msg.id,
            });
          }
        } catch (err) {
          console.error("Dizzy-Abuse: Ankündigung senden fehlgeschlagen:", err);
        }
      }

      await interaction.editReply({
        flags: reportEphemeralFlags(),
        components: [buildDizzyAbuseReportThanksContainer()],
      });

      return;
    }
  }
}

export async function handleDizzyAbuseRevertAfterDefer(
  interaction: ButtonInteraction,
): Promise<void> {
  const rawMember = interaction.member;

  if (rawMember === null || typeof rawMember === "string") {
    await interaction.followUp({
      flags: reportEphemeralFlags(),
      components: [buildUserFacingErrorContainer("Mitgliedsdaten fehlen.")],
    });

    return;
  }

  const guildMember = rawMember as GuildMember;

  if (!memberIsAdministrator(guildMember)) {
    await interaction.followUp({
      flags: reportEphemeralFlags(),
      components: [
        buildUserFacingErrorContainer("Nur für Mitglieder mit Administrator-Berechtigung."),
      ],
    });

    return;
  }

  const penaltyId = parseDizzyAbuseRevertButton(interaction.customId);

  if (penaltyId === undefined) {
    await interaction.followUp({
      flags: reportEphemeralFlags(),
      components: [buildUserFacingErrorContainer("Ungültige Schaltfläche.")],
    });

    return;
  }

  const now = new Date();
  const rev = await revertDizzyAbusePenalty({
    penaltyId,
    revertedByDiscordUserId: interaction.user.id,
    now,
  });

  if (!rev.ok) {
    const detail =
      rev.reason === "already_reverted"
        ? "Diese Strafe wurde bereits zurückgesetzt."
        : "Strafe nicht gefunden.";
    await interaction.followUp({
      flags: reportEphemeralFlags(),
      components: [buildUserFacingErrorContainer(detail)],
    });

    return;
  }

  const reverted = buildDizzyAbusePenaltyRevertedContainer({
    revertedByUserId: interaction.user.id,
    revertedAtIso: now.toISOString(),
  });
  await interaction.message.edit({
    flags: dizzyAbuseV2Flags(),
    components: [reverted],
    allowedMentions: { parse: [] },
  });
}
