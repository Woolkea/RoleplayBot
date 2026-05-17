import {
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  TextDisplayBuilder,
  type Interaction,
  type GuildMember,
} from "discord.js";

import { feedbackCommandName } from "@/commands/feedback/definition.js";

import { feedbackStatsCommandName } from "@/commands/feedback/feedback-stats-command.js";

import { addRobloxAccCommandName } from "@/commands/roblox-links/add-roblox-acc-command.js";

import { removeRobloxAccCommandName } from "@/commands/roblox-links/remove-roblox-acc-command.js";

import { robloxAddenCommandName } from "@/commands/roblox-links/roblox-adden-command.js";

import { teamlisteEditCommandName } from "@/commands/teamliste/teamliste-edit-command.js";

import { teamStatusCommandName } from "@/commands/team-member-text-status/team-status-command.js";

import { dizzykontrolleCommandName } from "@/commands/team-xp/dizzykontrolle-command.js";

import { leaderboardCommandName } from "@/commands/team-xp/leaderboard-command.js";

import { leaderboardResetCommandName } from "@/commands/team-xp/leaderboard-reset-command.js";

import { xpAddCommandName } from "@/commands/team-xp/xp-add-command.js";

import { xpBoostCommandName } from "@/commands/team-xp/xp-boost-command.js";

import { xpBoostStopCommandName } from "@/commands/team-xp/xp-boost-stop-command.js";

import { xpRemoveCommandName } from "@/commands/team-xp/xp-remove-command.js";

import { loadEnv } from "@/config/env.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import {
  adminCallBtnOpen,
  adminCallFieldLocation,
  adminCallFieldReason,
  adminCallFieldServer,
  adminCallFieldUsername,
  adminCallModalSubmit,
  feedbackBtnOpen,
  feedbackFieldCategory,
  feedbackFieldReason,
  feedbackFieldStars,
  feedbackFieldUser,
  feedbackModalSubmit,
  ingameBtnGetUserId,
  ingameBtnHistory,
  ingameFieldBanDuration,
  ingameFieldReason,
  ingameFieldServer,
  ingameFieldUsername,
  ingameModalBan,
  ingameModalGetUserId,
  ingameModalHistory,
  ingameModalKick,
  ingameModalUnban,
  ingameModalWarn,
  ingameSelectAction,
  parseAdminCallCancelFlowId,
  parseAdminCallClaimButton,
  parseAdminCallConfirmFlowId,
  parseDizzyAbuseReportButton,
  parseDizzyAbuseRevertButton,
  parseDizzyLinkCancelFlowId,
  parseDizzyLinkConfirmFlowId,
  parseOfficeRequestMoveButton,
  parseIngameDeleteEntryId,
  parseIngameFlowIdFromCancel,
  parseIngameFlowIdFromConfirm,
  parseIngameHistoryPage,
  parseTeamXpLeaderboardNextButton,
  parseTeamXpLeaderboardPageButton,
  parseTeamXpLeaderboardPrevButton,
  parseTeamlisteDeleteRowButton,
  parseTeamlisteEditRowButton,
  parseTeamlisteModalEditCategoryId,
  parseRobloxLinkCancelFlowId,
  parseRobloxLinkConfirmFlowId,
  parseTeamTxtStatusModalSubmitCustomId,
  regelwerkSelectCategory,
  robloxSetupBtnLink,
  robloxSetupBtnView,
  robloxSetupFieldMember,
  robloxSetupFieldUsername,
  robloxSetupModalLink,
  robloxSetupModalView,
  teamlisteBtnCreate,
  teamlisteFieldName,
  teamlisteFieldRoles,
  teamlisteModalCreate,
  teamTxtStatusBtnMine,
  teamTxtStatusFieldDescription,
  teamXpBtnStatus,
} from "@/interactions/custom-ids.js";

import {
  handleFeatureSetupSlash,
  isFeatureSetupCommand,
} from "@/interactions/feature-setup-slash.js";

import { tryHandleIngameServerStatsSlash } from "@/interactions/ingame-server-stats-slash.js";

import { tryHandleIngameStatsSetPlayerAckButton } from "@/interactions/ingame-server-stats-set-player-ack-button.js";

import { replyUserFacingError } from "@/interactions/user-error-reply.js";

import { adminCallsService } from "@/services/admin-calls/admin-calls-service.js";

import { AdminCallUserFacingError } from "@/services/admin-calls/admin-call-user-error.js";

import { adminCallFlowCache } from "@/services/admin-calls/flow-cache.js";

import {
  adminCallV2Flags,
  buildAdminCallConfirmSuccessContainer,
  buildAdminCallModal,
} from "@/services/admin-calls/ui-builders.js";

import { feedbackService } from "@/services/feedback/feedback-service.js";

import {
  loadFeedbackStatsForTarget,
  prepareFeedbackStatsTarget,
} from "@/services/feedback/feedback-stats.service.js";

import { FeedbackUserFacingError } from "@/services/feedback/feedback-user-error.js";

import {
  buildFeedbackLowStarsHintContainer,
  buildFeedbackModal,
  buildFeedbackStatsContainer,
  buildFeedbackSuccessContainer,
  feedbackV2Flags,
  resolveFeedbackCategoryLabel,
  resolveFeedbackStarsLabel,
} from "@/services/feedback/ui-builders.js";

import { officeRequestService } from "@/services/office-request/office-request-service.js";

import { OfficeRequestUserFacingError } from "@/services/office-request/office-request-user-error.js";

import {
  handleDizzyAbuseReportAfterDefer,
  handleDizzyAbuseRevertAfterDefer,
} from "@/services/team-xp/dizzy-abuse-service.js";

import { TEAM_FEEDBACK_XP_BY_STAR } from "@/services/team-xp/constants.js";

import { memberHasRoleId, memberHasTeamRole } from "@/services/team-xp/permissions.js";

import { TeamXpUserFacingError } from "@/services/team-xp/team-xp-user-error.js";

import {
  buildTeamXpLeaderboardContainer,
  buildTeamXpStatusContainer,
  teamXpV2Flags,
} from "@/services/team-xp/ui-builders.js";

import { renderTeamXpStatusCardPng } from "@/services/team-xp/status-card-image.js";

import { teamXpService } from "@/services/team-xp/xp-service.js";

import {
  createStaffDizzyPendingContainer,
  handleDizzyLinkButtonCancel,
  handleDizzyLinkButtonConfirm,
  resolveStaffDizzyTarget,
} from "@/services/team-xp/dizzy-roblox-flow.service.js";

import { teamMemberTextStatusService } from "@/services/team-member-text-status/team-member-text-status-service.js";

import { TeamMemberTextStatusUserFacingError } from "@/services/team-member-text-status/team-member-text-status-user-error.js";

import {
  buildTeamTextStatusModal,
  buildTeamTextStatusSuccessContainer,
} from "@/services/team-member-text-status/ui-builders.js";

import { robloxLinkFlowCache } from "@/services/roblox-links/flow-cache.js";

import { RobloxLinkUserFacingError } from "@/services/roblox-links/roblox-link-user-error.js";

import { robloxLinksService } from "@/services/roblox-links/roblox-links-service.js";

import {
  buildRobloxLinkPreviewContainer,
  buildRobloxStoredLinkViewContainer,
  robloxLinkV2Flags,
} from "@/services/roblox-links/ui-builders.js";

import { isRegelwerkCategoryKey } from "@/services/regelwerk/regelwerk-content.js";

import { RegelwerkUserFacingError } from "@/services/regelwerk/regelwerk-user-error.js";

import {
  buildRegelwerkDetailPageContainer,
  buildRegelwerkDetailPages,
  regelwerkDetailFollowUpFlags,
  regelwerkEphemeralV2Flags,
} from "@/services/regelwerk/ui-builders.js";

import {
  buildRobloxSetupLinkModal,
  buildRobloxSetupViewModal,
  robloxSetupV2Flags,
} from "@/services/roblox-setup/ui-builders.js";

import { TeamlisteUserFacingError } from "@/services/teamliste/teamliste-user-error.js";

import {
  buildTeamlisteAdminContainer,
  buildTeamlisteCategoryCreateModal,
  buildTeamlisteCategoryEditModal,
  teamlisteV2Flags,
} from "@/services/teamliste/ui-builders.js";

import { teamlisteService } from "@/services/teamliste/teamliste-service.js";

import { setTeamlisteAdminPanelMessage } from "@/services/teamliste/admin-panel-cache.js";

import { getRobloxLink } from "@/repositories/roblox-links.js";

import { parseBanDurationInput } from "@/services/ingame-moderation/ban-duration-input.js";

import { IngameUserFacingError } from "@/services/ingame-moderation/ingame-user-error.js";

import { ingameFlowCache, type IngameAction } from "@/services/ingame-moderation/flow-cache.js";

import { ingameModerationService } from "@/services/ingame-moderation/ingame-moderation-service.js";

import { setPendingIngamePanelMessage } from "@/services/ingame-moderation/panel-message-cache.js";

import { canDeleteIngameLogEntry } from "@/services/ingame-moderation/permissions.js";

import { refreshIngamePanelMessage } from "@/services/ingame-moderation/refresh-ingame-panel.js";

import { IngameServerStatsUserFacingError } from "@/services/ingame-server-stats/ingame-server-stats-user-error.js";

import {
  buildBanModal,
  buildGetUserIdModal,
  buildGetUserIdResultContainer,
  buildHistoryModal,
  buildKickModal,
  buildPreviewContainer,
  buildUnbanModal,
  buildWarnModal,
  formatPunishmentLinePreview,
  ingameV2Flags,
  parseServerShard,
} from "@/services/ingame-moderation/ui-builders.js";

function modalToAction(customId: string): IngameAction | undefined {
  switch (customId) {
    case ingameModalWarn:
      return "warn";
    case ingameModalKick:
      return "kick";
    case ingameModalBan:
      return "ban";
    case ingameModalUnban:
      return "unban";
    default:
      return undefined;
  }
}

function rememberIngamePanelFromInteraction(interaction: Interaction): void {
  if (!interaction.isMessageComponent()) {
    return;
  }

  const { guildId, channelId, message } = interaction;

  if (guildId === null) {
    return;
  }

  setPendingIngamePanelMessage(guildId, interaction.user.id, {
    channelId,
    messageId: message.id,
  });
}

export async function routeInteraction(interaction: Interaction): Promise<boolean> {
  try {
    if (interaction.isChatInputCommand() && isFeatureSetupCommand(interaction)) {
      await handleFeatureSetupSlash(interaction);

      return true;
    }

    const ingameServerStatsHandled = await tryHandleIngameServerStatsSlash(interaction);

    if (ingameServerStatsHandled) {
      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === leaderboardCommandName) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const page = interaction.options.getInteger("page") ?? 1;
      const guildId = interaction.guildId;
      const data = await teamXpService.getLeaderboardPage(guildId, page);
      const guild = interaction.guild;

      if (guild === null) {
        throw new TeamXpUserFacingError("Guild nicht gefunden.");
      }

      const entriesWithAvatars = await Promise.all(
        data.entries.map(async (e) => {
          try {
            const member = await guild.members.fetch(e.userId);

            return { ...e, avatarUrl: member.displayAvatarURL({ extension: "png", size: 64 }) };
          } catch {
            return { ...e, avatarUrl: null };
          }
        }),
      );
      const container = buildTeamXpLeaderboardContainer({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
        entries: entriesWithAvatars,
        includePagination: true,
      });
      await interaction.editReply({
        flags: teamXpV2Flags(),
        components: [container],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === dizzykontrolleCommandName) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      const env = loadEnv();
      const member = interaction.member as GuildMember | null;

      if (member === null) {
        throw new TeamXpUserFacingError("Mitgliedsdaten fehlen.");
      }

      if (!memberHasTeamRole(member, env.teamRoleId)) {
        throw new TeamXpUserFacingError(
          "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
        );
      }

      const robloxUsername = interaction.options.getString("roblox_username", true);
      const resolved = await resolveStaffDizzyTarget({
        guildId: interaction.guildId,
        robloxUsername,
      });

      if (!resolved.ok) {
        throw new TeamXpUserFacingError(resolved.message, {
          dizzyKontrolleLogFehler: resolved.logFehler,
        });
      }

      const preview = await createStaffDizzyPendingContainer({
        guildId: interaction.guildId,
        moderatorUserId: interaction.user.id,
        targetUserId: resolved.targetUserId,
        profile: resolved.profile,
      });
      await interaction.editReply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [preview],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === xpAddCommandName) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);
      const gained = await teamXpService.addXp(interaction.guildId, target.id, amount);
      const successContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.SUCCESS)} **+${String(gained)}** XP für <@${target.id}> (Basis ${String(amount)}, inkl. Boost).`,
        ),
      );
      await interaction.editReply({
        flags: teamXpV2Flags(),
        components: [successContainer],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === xpRemoveCommandName) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);
      await teamXpService.removeXp(interaction.guildId, target.id, amount);
      const successContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.SUCCESS)} **-${String(amount)}** XP von <@${target.id}> abgezogen.`,
        ),
      );
      await interaction.editReply({
        flags: teamXpV2Flags(),
        components: [successContainer],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === xpBoostCommandName) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const percent = interaction.options.getNumber("percent", true);
      const hours = interaction.options.getInteger("hours", true);
      const reason = interaction.options.getString("grund", true);
      const { announcementUrl } = await teamXpService.setGlobalBoostWithAnnouncement({
        client: interaction.client,
        guildId: interaction.guildId,
        percent,
        hours,
        reason,
        setterUserId: interaction.user.id,
      });
      const successContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.SUCCESS)} Globaler Boost aktiv: **+${String(percent)} %** für **${String(hours)}** Stunden.\nÖffentliche Ankündigung: ${announcementUrl}`,
        ),
      );
      await interaction.editReply({
        flags: teamXpV2Flags(),
        components: [successContainer],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === xpBoostStopCommandName) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const ended = await teamXpService.stopGlobalBoost({
        client: interaction.client,
        guildId: interaction.guildId,
      });
      const successContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.SUCCESS)} Globaler XP-Boost beendet — **${String(ended)}** ${ended === 1 ? "Eintrag" : "Einträge"} sofort ausgeschaltet.`,
        ),
      );
      await interaction.editReply({
        flags: teamXpV2Flags(),
        components: [successContainer],
      });

      return true;
    }

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === leaderboardResetCommandName
    ) {
      if (interaction.guildId === null) {
        throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await teamXpService.resetLeaderboard(interaction.guildId);
      const successContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.SUCCESS)} Das Team-Leaderboard wurde zurückgesetzt.`,
        ),
      );
      await interaction.editReply({
        flags: teamXpV2Flags(),
        components: [successContainer],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === feedbackCommandName) {
      if (interaction.guildId === null) {
        throw new FeedbackUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.showModal(buildFeedbackModal());

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === feedbackStatsCommandName) {
      if (interaction.guildId === null || interaction.guild === null) {
        throw new FeedbackUserFacingError("Nur in einer Guild verfügbar.");
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const member = interaction.member as GuildMember | null;

      if (member === null) {
        throw new FeedbackUserFacingError("Mitgliedsdaten fehlen.");
      }

      const env = loadEnv();
      const requestedUser = interaction.options.getUser("user");
      const targetUserId = await prepareFeedbackStatsTarget({
        guild: interaction.guild,
        actorMember: member,
        actorUserId: interaction.user.id,
        requestedUser,
        env,
      });
      const { count, averageFormatted } = await loadFeedbackStatsForTarget({
        guildId: interaction.guildId,
        targetUserId,
      });
      await interaction.editReply({
        flags: feedbackV2Flags(),
        components: [
          buildFeedbackStatsContainer({
            targetUserId,
            totalCount: count,
            averageFormatted,
          }),
        ],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === teamStatusCommandName) {
      if (interaction.guildId === null) {
        throw new TeamMemberTextStatusUserFacingError("Nur in einer Guild verfügbar.");
      }

      const guildId = interaction.guildId;
      const aktion = interaction.options.getString("aktion", true);

      if (aktion !== "get" && aktion !== "set") {
        throw new TeamMemberTextStatusUserFacingError("Ungültige Aktion.");
      }

      const env = loadEnv();

      if (env.teamStatusModRoleId === undefined) {
        throw new TeamMemberTextStatusUserFacingError(
          "Dieser Befehl ist hier nicht freigeschaltet.",
        );
      }

      const member = interaction.member as GuildMember | null;

      if (member === null) {
        throw new TeamMemberTextStatusUserFacingError("Mitgliedsdaten fehlen.");
      }

      if (!memberHasRoleId(member, env.teamStatusModRoleId)) {
        throw new TeamMemberTextStatusUserFacingError("Dafür brauchst du die passende Rolle.");
      }

      const guild = interaction.guild;

      if (guild === null) {
        throw new TeamMemberTextStatusUserFacingError("Guild nicht gefunden.");
      }

      const target = interaction.options.getUser("user", true);

      if (target.bot) {
        throw new TeamMemberTextStatusUserFacingError("Bei Bots geht das nicht.");
      }

      if (env.teamRoleId !== undefined) {
        let targetMember: GuildMember;

        try {
          targetMember = await guild.members.fetch(target.id);
        } catch {
          throw new TeamMemberTextStatusUserFacingError("Mitglied nicht in dieser Guild gefunden.");
        }

        if (!memberHasTeamRole(targetMember, env.teamRoleId)) {
          throw new TeamMemberTextStatusUserFacingError(
            "Dieses Mitglied hat nicht die Team-Rolle.",
          );
        }
      }

      if (aktion === "get") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const payload = await teamMemberTextStatusService.buildMemberStatusPayload({
          guildId,
          memberUserId: target.id,
        });
        const container = teamMemberTextStatusService.buildMyStatusContainer(payload);
        await interaction.editReply({
          flags: teamXpV2Flags(),
          components: [container],
        });

        return true;
      }

      await interaction.showModal(buildTeamTextStatusModal({ targetUserId: target.id }));

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === teamlisteEditCommandName) {
      if (interaction.guildId === null) {
        throw new TeamlisteUserFacingError("Nur in einer Guild verfügbar.");
      }

      const guildId = interaction.guildId;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const categories = await teamlisteService.listCategories(guildId);
      const container = buildTeamlisteAdminContainer(categories);
      const msg = await interaction.editReply({
        flags: teamlisteV2Flags(),
        components: [container],
      });
      setTeamlisteAdminPanelMessage(guildId, interaction.user.id, {
        channelId: msg.channelId,
        messageId: msg.id,
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === robloxAddenCommandName) {
      if (interaction.guildId === null) {
        throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
      }

      const guildId = interaction.guildId;
      const env = loadEnv();
      const member = interaction.member as GuildMember | null;

      if (member === null) {
        throw new RobloxLinkUserFacingError("Mitgliedsdaten fehlen.");
      }

      if (!memberHasTeamRole(member, env.teamRoleId)) {
        throw new RobloxLinkUserFacingError(
          "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
        );
      }

      const benutzername = interaction.options.getString("benutzername", true);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const { flowId, state } = await robloxLinksService.resolveProfileAndCacheFlow({
        guildId,
        actorDiscordUserId: interaction.user.id,
        targetDiscordUserId: interaction.user.id,
        robloxUsername: benutzername,
      });
      await interaction.editReply({
        flags: robloxLinkV2Flags(),
        components: [buildRobloxLinkPreviewContainer({ flowId, profile: state.profile })],
      });

      return true;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === addRobloxAccCommandName) {
      if (interaction.guildId === null) {
        throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
      }

      const guildId = interaction.guildId;
      const guild = interaction.guild;

      if (guild === null) {
        throw new RobloxLinkUserFacingError("Guild nicht gefunden.");
      }

      const env = loadEnv();
      const actor = interaction.member as GuildMember | null;

      if (actor === null || !actor.permissions.has(PermissionFlagsBits.Administrator)) {
        throw new RobloxLinkUserFacingError("Nur für Administratoren.");
      }

      const targetUser = interaction.options.getUser("user", true);
      const benutzername = interaction.options.getString("benutzername", true);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember === null) {
        throw new RobloxLinkUserFacingError("Zielnutzer ist kein Mitglied dieses Servers.");
      }

      if (!memberHasTeamRole(targetMember, env.teamRoleId)) {
        throw new RobloxLinkUserFacingError("Der Zielnutzer muss die Team-Rolle haben.");
      }

      const { flowId, state } = await robloxLinksService.resolveProfileAndCacheFlow({
        guildId,
        actorDiscordUserId: interaction.user.id,
        targetDiscordUserId: targetUser.id,
        robloxUsername: benutzername,
      });
      await interaction.editReply({
        flags: robloxLinkV2Flags(),
        components: [buildRobloxLinkPreviewContainer({ flowId, profile: state.profile })],
      });

      return true;
    }

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === removeRobloxAccCommandName
    ) {
      if (interaction.guildId === null) {
        throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
      }

      const guildId = interaction.guildId;
      const actor = interaction.member as GuildMember | null;

      if (actor === null || !actor.permissions.has(PermissionFlagsBits.Administrator)) {
        throw new RobloxLinkUserFacingError("Nur für Administratoren.");
      }

      const targetUser = interaction.options.getUser("user", true);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const removed = await robloxLinksService.removeLink({
        guildId,
        targetDiscordUserId: targetUser.id,
        client: interaction.client,
      });

      if (!removed) {
        throw new RobloxLinkUserFacingError(
          "Für diesen Nutzer ist keine Roblox-Verknüpfung gespeichert.",
        );
      }

      const successContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${emojiToString(EMOJIS.SUCCESS)} Roblox-Verknüpfung entfernt.`,
        ),
      );
      await interaction.editReply({
        flags: robloxLinkV2Flags(),
        components: [successContainer],
      });

      return true;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === ingameSelectAction) {
      const kind = interaction.values.at(0);

      switch (kind) {
        case "warn":
          await interaction.showModal(buildWarnModal());
          break;
        case "kick":
          await interaction.showModal(buildKickModal());
          break;
        case "ban":
          await interaction.showModal(buildBanModal());
          break;
        case "unban":
          await interaction.showModal(buildUnbanModal());
          break;
        default:
          throw new IngameUserFacingError("Unbekannte Aktion.");
      }

      rememberIngamePanelFromInteraction(interaction);

      return true;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === regelwerkSelectCategory) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const key = interaction.values.at(0);

      if (key === undefined || !isRegelwerkCategoryKey(key)) {
        throw new RegelwerkUserFacingError("Unbekannte Auswahl.");
      }

      const pages = buildRegelwerkDetailPages(key);

      if (pages.length === 0) {
        throw new RegelwerkUserFacingError("Kein Regeltext vorhanden.");
      }

      await interaction.editReply({
        flags: regelwerkEphemeralV2Flags(),
        components: [buildRegelwerkDetailPageContainer(pages[0])],
      });

      for (let i = 1; i < pages.length; i++) {
        await interaction.followUp({
          flags: regelwerkDetailFollowUpFlags(),
          components: [buildRegelwerkDetailPageContainer(pages[i])],
        });
      }

      return true;
    }

    if (interaction.isButton()) {
      const dizzyLinkConfirmFlowId = parseDizzyLinkConfirmFlowId(interaction.customId);

      if (dizzyLinkConfirmFlowId !== undefined) {
        await handleDizzyLinkButtonConfirm(interaction);

        return true;
      }

      const dizzyLinkCancelFlowId = parseDizzyLinkCancelFlowId(interaction.customId);

      if (dizzyLinkCancelFlowId !== undefined) {
        await handleDizzyLinkButtonCancel(interaction);

        return true;
      }

      const dizzyAbuseReportMessageId = parseDizzyAbuseReportButton(interaction.customId);

      if (dizzyAbuseReportMessageId !== undefined) {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
        await handleDizzyAbuseReportAfterDefer(interaction);

        return true;
      }

      const dizzyAbuseRevertPenaltyId = parseDizzyAbuseRevertButton(interaction.customId);

      if (dizzyAbuseRevertPenaltyId !== undefined) {
        await interaction.deferUpdate();
        await handleDizzyAbuseRevertAfterDefer(interaction);

        return true;
      }

      const ingameStatsSetPlayerAckHandled =
        await tryHandleIngameStatsSetPlayerAckButton(interaction);

      if (ingameStatsSetPlayerAckHandled) {
        return true;
      }

      if (interaction.customId === feedbackBtnOpen) {
        if (interaction.guildId === null) {
          throw new FeedbackUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.showModal(buildFeedbackModal());

        return true;
      }

      if (interaction.customId === robloxSetupBtnLink) {
        if (interaction.guildId === null) {
          throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
        }

        const env = loadEnv();
        const member = interaction.member as GuildMember | null;

        if (member === null) {
          throw new RobloxLinkUserFacingError("Mitgliedsdaten fehlen.");
        }

        if (!memberHasTeamRole(member, env.teamRoleId)) {
          throw new RobloxLinkUserFacingError(
            "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
          );
        }

        await interaction.showModal(buildRobloxSetupLinkModal());

        return true;
      }

      if (interaction.customId === robloxSetupBtnView) {
        if (interaction.guildId === null) {
          throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
        }

        const env = loadEnv();
        const member = interaction.member as GuildMember | null;

        if (member === null) {
          throw new RobloxLinkUserFacingError("Mitgliedsdaten fehlen.");
        }

        if (!memberHasTeamRole(member, env.teamRoleId)) {
          throw new RobloxLinkUserFacingError(
            "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
          );
        }

        await interaction.showModal(buildRobloxSetupViewModal());

        return true;
      }

      if (interaction.customId === adminCallBtnOpen) {
        if (interaction.guildId === null) {
          throw new AdminCallUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.showModal(buildAdminCallModal());

        return true;
      }

      if (interaction.customId === teamlisteBtnCreate) {
        await interaction.showModal(buildTeamlisteCategoryCreateModal());

        return true;
      }

      const editRowId = parseTeamlisteEditRowButton(interaction.customId);

      if (editRowId !== undefined) {
        if (interaction.guildId === null) {
          throw new TeamlisteUserFacingError("Nur in einer Guild verfügbar.");
        }

        const category = await teamlisteService.getCategoryById({
          guildId: interaction.guildId,
          categoryId: editRowId,
        });

        if (category === null) {
          throw new TeamlisteUserFacingError("Kategorie nicht gefunden.");
        }

        await interaction.showModal(buildTeamlisteCategoryEditModal({ category }));

        return true;
      }

      const deleteRowId = parseTeamlisteDeleteRowButton(interaction.customId);

      if (deleteRowId !== undefined) {
        if (interaction.guildId === null) {
          throw new TeamlisteUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.deferUpdate();
        const guildId = interaction.guildId;
        await teamlisteService.deleteCategory({
          client: interaction.client,
          guildId,
          categoryId: deleteRowId,
        });
        const categories = await teamlisteService.listCategories(guildId);
        await interaction.editReply({
          flags: teamlisteV2Flags(),
          components: [buildTeamlisteAdminContainer(categories)],
        });

        return true;
      }

      const robloxConfirmFlowId = parseRobloxLinkConfirmFlowId(interaction.customId);

      if (robloxConfirmFlowId !== undefined) {
        await interaction.deferUpdate();
        await robloxLinksService.confirmLink({
          flowId: robloxConfirmFlowId,
          interactionUserId: interaction.user.id,
          client: interaction.client,
        });
        const successContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${emojiToString(EMOJIS.SUCCESS)} Roblox-Account verknüpft.`,
          ),
        );
        await interaction.editReply({
          flags: robloxLinkV2Flags(),
          components: [successContainer],
        });

        return true;
      }

      const robloxCancelFlowId = parseRobloxLinkCancelFlowId(interaction.customId);

      if (robloxCancelFlowId !== undefined) {
        await interaction.deferUpdate();
        robloxLinkFlowCache.delete(robloxCancelFlowId);
        await interaction.deleteReply();

        return true;
      }

      const adminCallConfirmFlowId = parseAdminCallConfirmFlowId(interaction.customId);

      if (adminCallConfirmFlowId !== undefined) {
        await interaction.deferUpdate();
        await adminCallsService.confirmCall({
          flowId: adminCallConfirmFlowId,
          interactionUserId: interaction.user.id,
          client: interaction.client,
        });
        await interaction.editReply({
          flags: adminCallV2Flags(),
          components: [buildAdminCallConfirmSuccessContainer()],
        });

        return true;
      }

      const adminCallCancelFlowId = parseAdminCallCancelFlowId(interaction.customId);

      if (adminCallCancelFlowId !== undefined) {
        await interaction.deferUpdate();
        adminCallFlowCache.delete(adminCallCancelFlowId);
        await interaction.deleteReply();

        return true;
      }

      const adminCallClaimId = parseAdminCallClaimButton(interaction.customId);

      if (adminCallClaimId !== undefined) {
        await interaction.deferUpdate();
        const guildId = interaction.guildId;

        if (guildId === null) {
          throw new AdminCallUserFacingError("Nur in einer Guild verfügbar.");
        }

        const member = interaction.member as GuildMember | null;

        if (member === null) {
          throw new AdminCallUserFacingError("Mitgliedsdaten fehlen.");
        }

        const env = loadEnv();

        if (!memberHasTeamRole(member, env.teamRoleId)) {
          throw new AdminCallUserFacingError(
            "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
          );
        }

        const logPayload = await adminCallsService.claimCall({
          callId: adminCallClaimId,
          guildId,
          claimerDiscordUserId: interaction.user.id,
          claimerDisplayName: member.displayName,
        });
        await interaction.message.edit({
          flags: adminCallV2Flags(),
          components: logPayload.components,
        });

        return true;
      }

      const officeMoveRequestId = parseOfficeRequestMoveButton(interaction.customId);

      if (officeMoveRequestId !== undefined) {
        await interaction.deferUpdate();
        const payload = await officeRequestService.processMoveButton(interaction);
        await interaction.message.edit({
          flags: payload.flags,
          components: payload.components,
        });

        return true;
      }

      if (interaction.customId === teamTxtStatusBtnMine) {
        if (interaction.guildId === null) {
          throw new TeamMemberTextStatusUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const payload = await teamMemberTextStatusService.buildMyStatusPayload({
          guildId: interaction.guildId,
          viewerUserId: interaction.user.id,
        });
        const container = teamMemberTextStatusService.buildMyStatusContainer(payload);
        await interaction.editReply({
          flags: teamXpV2Flags(),
          components: [container],
        });

        return true;
      }

      if (interaction.customId === teamXpBtnStatus) {
        if (interaction.guildId === null) {
          throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guild = interaction.guild;

        if (guild === null) {
          throw new TeamXpUserFacingError("Guild nicht gefunden.");
        }

        const member = await guild.members.fetch(interaction.user.id);
        const xp = await teamXpService.getXp(interaction.guildId, interaction.user.id);
        const averageXp = await teamXpService.getAverageXp(interaction.guildId);
        const { userHistory, avgHistory } = await teamXpService.getHistory(
          interaction.guildId,
          interaction.user.id,
        );

        try {
          const png = await renderTeamXpStatusCardPng({ member, xp, userHistory, avgHistory });
          await interaction.editReply({
            files: [{ attachment: png, name: "team-status.png" }],
          });
        } catch (err: unknown) {
          console.error("team status card render failed:", err);
          const container = buildTeamXpStatusContainer({ xp, averageXp });
          await interaction.editReply({
            flags: teamXpV2Flags(),
            components: [container],
          });
        }

        return true;
      }

      const directLbPage = parseTeamXpLeaderboardPageButton(interaction.customId);
      const prevFromPage = parseTeamXpLeaderboardPrevButton(interaction.customId);
      const nextFromPage = parseTeamXpLeaderboardNextButton(interaction.customId);
      const resolvedLeaderboardPage =
        directLbPage !== undefined
          ? directLbPage
          : prevFromPage !== undefined
            ? Math.max(1, prevFromPage - 1)
            : nextFromPage !== undefined
              ? nextFromPage + 1
              : undefined;

      if (resolvedLeaderboardPage !== undefined) {
        if (interaction.guildId === null) {
          throw new TeamXpUserFacingError("Nur in einer Guild verfügbar.");
        }

        const guildId = interaction.guildId;
        const fromEphemeralLeaderboard = interaction.message.flags.has(MessageFlags.Ephemeral);

        if (!fromEphemeralLeaderboard) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } else {
          await interaction.deferUpdate();
        }

        const data = await teamXpService.getLeaderboardPage(guildId, resolvedLeaderboardPage);
        const guild = interaction.guild;

        if (guild === null) {
          throw new TeamXpUserFacingError("Guild nicht gefunden.");
        }

        const entriesWithAvatars = await Promise.all(
          data.entries.map(async (e) => {
            try {
              const member = await guild.members.fetch(e.userId);

              return { ...e, avatarUrl: member.displayAvatarURL({ extension: "png", size: 64 }) };
            } catch {
              return { ...e, avatarUrl: null };
            }
          }),
        );
        const container = buildTeamXpLeaderboardContainer({
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
          entries: entriesWithAvatars,
          includePagination: true,
        });
        await interaction.editReply({
          flags: teamXpV2Flags(),
          components: [container],
        });

        return true;
      }

      if (interaction.customId === ingameBtnHistory) {
        await interaction.showModal(buildHistoryModal());
        rememberIngamePanelFromInteraction(interaction);

        return true;
      }

      if (interaction.customId === ingameBtnGetUserId) {
        await interaction.showModal(buildGetUserIdModal());
        rememberIngamePanelFromInteraction(interaction);

        return true;
      }

      const confirmFlowId = parseIngameFlowIdFromConfirm(interaction.customId);

      if (confirmFlowId !== undefined) {
        await interaction.deferUpdate();
        const { logChannelId, logContainer, entryId } =
          await ingameModerationService.confirmModeration(confirmFlowId);

        try {
          const ch = await interaction.client.channels.fetch(logChannelId);

          if (ch === null || ch.type !== ChannelType.GuildText) {
            await ingameModerationService.removeInsertedEntry(entryId);
            throw new IngameUserFacingError(
              "Log-Kanal nicht gefunden oder kein Textkanal. Der Datenbank-Eintrag wurde verworfen.",
            );
          }

          await ch.send({
            flags: ingameV2Flags(),
            components: [logContainer],
          });
        } catch (error: unknown) {
          if (error instanceof IngameUserFacingError) {
            throw error;
          }

          await ingameModerationService
            .removeInsertedEntry(entryId)
            .catch((rollbackErr: unknown) => {
              console.error("rollback after failed log send:", rollbackErr);
            });
          throw new IngameUserFacingError(
            "Log-Nachricht konnte nicht gesendet werden. Der Datenbank-Eintrag wurde verworfen.",
          );
        }

        const successContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${emojiToString(EMOJIS.SUCCESS)} Eintrag erfolgreich`,
          ),
        );
        await interaction.editReply({ components: [successContainer] });
        void setTimeout(() => {
          void interaction.deleteReply();
        }, 2000);

        return true;
      }

      const cancelFlowId = parseIngameFlowIdFromCancel(interaction.customId);

      if (cancelFlowId !== undefined) {
        await interaction.deferUpdate();
        ingameFlowCache.delete(cancelFlowId);
        await interaction.deleteReply();

        return true;
      }

      const deleteEntryId = parseIngameDeleteEntryId(interaction.customId);

      if (deleteEntryId !== undefined) {
        await interaction.deferUpdate();
        const guildId = interaction.guildId;

        if (!guildId) {
          throw new IngameUserFacingError("Nur in einer Guild.");
        }

        const row = await ingameModerationService.getModerationEntryById(deleteEntryId);
        if (!row) throw new IngameUserFacingError("Eintrag nicht gefunden.");
        const actor = interaction.member as GuildMember | null;

        if (!actor) {
          throw new IngameUserFacingError("Mitglieds-Informationen fehlen.");
        }

        if (
          !(await canDeleteIngameLogEntry({
            actor,
            originalModeratorUserId: row.moderatorDiscordUserId,
          }))
        ) {
          throw new IngameUserFacingError("Keine Berechtigung zum Löschen.");
        }

        const env = loadEnv();
        const logChannelIds = [
          env.ingameLogsServer1ChannelId,
          env.ingameLogsServer2ChannelId,
        ].filter((id): id is string => id !== undefined && id.length > 0);
        const isLogChannel =
          interaction.channel?.type === ChannelType.GuildText &&
          logChannelIds.includes(interaction.channelId);
        const result = await ingameModerationService.deleteLogEntry({
          entryId: deleteEntryId,
          actorId: interaction.user.id,
          guildId,
          isLogChannel,
        });

        if (isLogChannel) {
          await interaction.message.delete();
        } else if (result.refreshContainers) {
          await interaction.editReply({
            flags: ingameV2Flags(),
            components: result.refreshContainers,
          });
        }

        return true;
      }

      const historyPage = parseIngameHistoryPage(interaction.customId);

      if (historyPage !== undefined) {
        await interaction.deferUpdate();
        const guildId = interaction.guildId;
        if (!guildId) throw new IngameUserFacingError("Nur in einer Guild.");
        const containers = await ingameModerationService.getHistoryPageContainers({
          guildId,
          robloxUserId: historyPage.robloxUserId,
          s1Page: historyPage.s1Page,
          s2Page: historyPage.s2Page,
        });
        await interaction.editReply({
          flags: ingameV2Flags(),
          components: containers,
        });

        return true;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === robloxSetupModalLink) {
        if (interaction.guildId === null) {
          throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;
        const env = loadEnv();
        const member = interaction.member as GuildMember | null;

        if (member === null) {
          throw new RobloxLinkUserFacingError("Mitgliedsdaten fehlen.");
        }

        if (!memberHasTeamRole(member, env.teamRoleId)) {
          throw new RobloxLinkUserFacingError(
            "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
          );
        }

        const benutzername = interaction.fields.getTextInputValue(robloxSetupFieldUsername);
        const { flowId, state } = await robloxLinksService.resolveProfileAndCacheFlow({
          guildId,
          actorDiscordUserId: interaction.user.id,
          targetDiscordUserId: interaction.user.id,
          robloxUsername: benutzername,
        });
        await interaction.editReply({
          flags: robloxLinkV2Flags(),
          components: [buildRobloxLinkPreviewContainer({ flowId, profile: state.profile })],
        });

        return true;
      }

      if (interaction.customId === robloxSetupModalView) {
        if (interaction.guildId === null) {
          throw new RobloxLinkUserFacingError("Nur in einer Guild verfügbar.");
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;
        const env = loadEnv();
        const actor = interaction.member as GuildMember | null;

        if (actor === null) {
          throw new RobloxLinkUserFacingError("Mitgliedsdaten fehlen.");
        }

        if (!memberHasTeamRole(actor, env.teamRoleId)) {
          throw new RobloxLinkUserFacingError(
            "Nur für Teammitglieder mit der konfigurierten Team-Rolle.",
          );
        }

        const guild = interaction.guild;

        if (guild === null) {
          throw new RobloxLinkUserFacingError("Guild nicht gefunden.");
        }

        const users = interaction.fields.getSelectedUsers(robloxSetupFieldMember, true);
        const targetUser = users.first();

        if (targetUser === undefined) {
          throw new RobloxLinkUserFacingError("Bitte ein Mitglied auswählen.");
        }

        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        if (targetMember === null) {
          throw new RobloxLinkUserFacingError("Zielnutzer ist kein Mitglied dieses Servers.");
        }

        if (!memberHasTeamRole(targetMember, env.teamRoleId)) {
          throw new RobloxLinkUserFacingError("Der ausgewählte Nutzer muss die Team-Rolle haben.");
        }

        const link = await getRobloxLink({ guildId, discordUserId: targetUser.id });

        if (link === null) {
          throw new RobloxLinkUserFacingError(
            "Für diesen Nutzer ist keine Roblox-Verknüpfung gespeichert.",
          );
        }

        await interaction.editReply({
          flags: robloxSetupV2Flags(),
          components: [buildRobloxStoredLinkViewContainer(link)],
        });

        return true;
      }

      if (interaction.customId === teamlisteModalCreate) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;

        if (guildId === null) {
          throw new TeamlisteUserFacingError("Nur in einer Guild verfügbar.");
        }

        const name = interaction.fields.getTextInputValue(teamlisteFieldName);
        const roles = interaction.fields.getSelectedRoles(teamlisteFieldRoles, true);
        const roleIds: string[] = [];

        for (const r of roles.values()) {
          if (r !== null) {
            roleIds.push(r.id);
          }
        }

        await teamlisteService.createCategory({
          client: interaction.client,
          guildId,
          name,
          roleIds,
        });
        await teamlisteService.refreshAdminEphemeralPanel({
          client: interaction.client,
          guildId,
          userId: interaction.user.id,
        });
        const successContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${emojiToString(EMOJIS.SUCCESS)} Kategorie erstellt und Panel aktualisiert.`,
          ),
        );
        await interaction.editReply({
          flags: teamlisteV2Flags(),
          components: [successContainer],
        });

        return true;
      }

      const teamlisteEditCategoryId = parseTeamlisteModalEditCategoryId(interaction.customId);

      if (teamlisteEditCategoryId !== undefined) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;

        if (guildId === null) {
          throw new TeamlisteUserFacingError("Nur in einer Guild verfügbar.");
        }

        const name = interaction.fields.getTextInputValue(teamlisteFieldName);
        const roles = interaction.fields.getSelectedRoles(teamlisteFieldRoles, true);
        const roleIds: string[] = [];

        for (const r of roles.values()) {
          if (r !== null) {
            roleIds.push(r.id);
          }
        }

        await teamlisteService.updateCategory({
          client: interaction.client,
          guildId,
          categoryId: teamlisteEditCategoryId,
          name,
          roleIds,
        });
        await teamlisteService.refreshAdminEphemeralPanel({
          client: interaction.client,
          guildId,
          userId: interaction.user.id,
        });
        const successContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${emojiToString(EMOJIS.SUCCESS)} Kategorie aktualisiert und Panel aktualisiert.`,
          ),
        );
        await interaction.editReply({
          flags: teamlisteV2Flags(),
          components: [successContainer],
        });

        return true;
      }

      const teamTxtStatusTargetId = parseTeamTxtStatusModalSubmitCustomId(interaction.customId);

      if (teamTxtStatusTargetId !== undefined) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;

        if (guildId === null) {
          throw new TeamMemberTextStatusUserFacingError("Nur in einer Guild verfügbar.");
        }

        const env = loadEnv();

        if (env.teamStatusModRoleId === undefined) {
          throw new TeamMemberTextStatusUserFacingError(
            "Dieser Befehl ist hier nicht freigeschaltet.",
          );
        }

        const member = interaction.member as GuildMember | null;

        if (member === null || !memberHasRoleId(member, env.teamStatusModRoleId)) {
          throw new TeamMemberTextStatusUserFacingError("Dafür brauchst du die passende Rolle.");
        }

        const description = interaction.fields.getTextInputValue(teamTxtStatusFieldDescription);
        await teamMemberTextStatusService.setStatus({
          guildId,
          targetUserId: teamTxtStatusTargetId,
          actorUserId: interaction.user.id,
          description,
        });
        await interaction.editReply({
          flags: teamXpV2Flags(),
          components: [
            buildTeamTextStatusSuccessContainer({ targetUserId: teamTxtStatusTargetId }),
          ],
        });

        return true;
      }

      if (interaction.customId === feedbackModalSubmit) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;

        if (!guildId) {
          throw new FeedbackUserFacingError("Nur in einer Guild verfügbar.");
        }

        const users = interaction.fields.getSelectedUsers(feedbackFieldUser, true);
        const targetUser = users.first();

        if (targetUser === undefined) {
          throw new FeedbackUserFacingError("Bitte ein Teammitglied auswählen.");
        }

        const catVals = interaction.fields.getStringSelectValues(feedbackFieldCategory);
        const categoryLabel = resolveFeedbackCategoryLabel(catVals[0]);
        const starVals = interaction.fields.getStringSelectValues(feedbackFieldStars);

        if (starVals.length === 0) {
          throw new FeedbackUserFacingError("Bitte Sterne wählen.");
        }

        const starsLabel = resolveFeedbackStarsLabel(starVals[0] ?? "");
        const reason = interaction.fields.getTextInputValue(feedbackFieldReason).trim();

        if (reason.length === 0) {
          throw new FeedbackUserFacingError("Bitte einen Grund angeben.");
        }

        await feedbackService.submitFeedback({
          client: interaction.client,
          guildId,
          authorUserId: interaction.user.id,
          targetUserId: targetUser.id,
          categoryLabel,
          starsLabel,
          reason,
        });
        const starKey = starVals[0] ?? "";
        let replyContainers = [buildFeedbackSuccessContainer()];

        if (starKey === "1" || starKey === "2") {
          replyContainers = [buildFeedbackLowStarsHintContainer()];
        } else {
          switch (starKey) {
            case "4":
              await teamXpService.addXp(guildId, targetUser.id, TEAM_FEEDBACK_XP_BY_STAR["4"]);
              break;
            case "5":
              await teamXpService.addXp(guildId, targetUser.id, TEAM_FEEDBACK_XP_BY_STAR["5"]);
              break;
            default:
              break;
          }
        }

        await interaction.editReply({
          flags: feedbackV2Flags(),
          components: replyContainers,
        });

        return true;
      }

      if (interaction.customId === adminCallModalSubmit) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;

        if (guildId === null) {
          throw new AdminCallUserFacingError("Nur in einer Guild verfügbar.");
        }

        const serverValues = interaction.fields.getStringSelectValues(adminCallFieldServer);
        const serverShard = parseServerShard(serverValues[0] ?? "");

        if (serverShard === undefined) {
          throw new AdminCallUserFacingError("Ungültige Server-Auswahl.");
        }

        const robloxUsername = interaction.fields.getTextInputValue(adminCallFieldUsername);
        const location = interaction.fields.getTextInputValue(adminCallFieldLocation);
        const reason = interaction.fields.getTextInputValue(adminCallFieldReason);
        const { previewContainer } = await adminCallsService.processModalSubmit({
          guildId,
          authorDiscordUserId: interaction.user.id,
          serverShard,
          robloxUsername,
          location,
          reason,
        });
        await interaction.editReply({
          flags: adminCallV2Flags(),
          components: [previewContainer],
        });

        return true;
      }

      const action = modalToAction(interaction.customId);

      if (action !== undefined) {
        const guildId = interaction.guildId;
        if (!guildId) throw new IngameUserFacingError("Nur in einer Guild verfügbar.");
        const serverValues = interaction.fields.getStringSelectValues(ingameFieldServer);
        const serverShard = parseServerShard(serverValues[0] ?? "");
        if (!serverShard) throw new IngameUserFacingError("Ungültige Server-Auswahl.");
        const username = interaction.fields.getTextInputValue(ingameFieldUsername).trim();
        const reason = interaction.fields.getTextInputValue(ingameFieldReason).trim();
        let banIsPermanent = false;
        let banDurationDays: number | null = null;

        if (action === "ban") {
          const raw = interaction.fields.getTextInputValue(ingameFieldBanDuration);
          const parsed = parseBanDurationInput(raw);
          if (!parsed.ok) throw new IngameUserFacingError(parsed.message);
          banIsPermanent = parsed.isPermanent;
          banDurationDays = parsed.durationDays;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { flowId, profile } = await ingameModerationService.processModerationModalSubmit({
          guildId,
          moderatorUserId: interaction.user.id,
          serverShard,
          username,
          reason,
          action,
          banIsPermanent,
          banDurationDays,
        });
        const punishmentLine = formatPunishmentLinePreview({
          action,
          banIsPermanent,
          banDurationDays,
          includePrefix: true,
        });
        const preview = buildPreviewContainer({ flowId, profile, punishmentLine, reason });
        await interaction.editReply({
          flags: ingameV2Flags(),
          components: [preview],
        });
        await refreshIngamePanelMessage(interaction.client, guildId, interaction.user.id);

        return true;
      }

      if (interaction.customId === ingameModalHistory) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;
        if (!guildId) throw new IngameUserFacingError("Nur in einer Guild verfügbar.");
        const username = interaction.fields.getTextInputValue(ingameFieldUsername).trim();
        const { containers } = await ingameModerationService.getHistoryContainers({
          guildId,
          username,
        });
        await interaction.editReply({
          flags: ingameV2Flags(),
          components: containers,
        });
        await refreshIngamePanelMessage(interaction.client, guildId, interaction.user.id);

        return true;
      }

      if (interaction.customId === ingameModalGetUserId) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;
        if (!guildId) throw new IngameUserFacingError("Nur in einer Guild verfügbar.");
        const username = interaction.fields.getTextInputValue(ingameFieldUsername).trim();
        const { profile } = await ingameModerationService.getHistoryContainers({
          guildId,
          username,
        });
        await interaction.editReply({
          flags: ingameV2Flags(),
          components: [buildGetUserIdResultContainer(profile)],
        });
        await refreshIngamePanelMessage(interaction.client, guildId, interaction.user.id);

        return true;
      }
    }
  } catch (error: unknown) {
    if (error instanceof IngameUserFacingError || error instanceof FeedbackUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof TeamXpUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof TeamlisteUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof RobloxLinkUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof AdminCallUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof OfficeRequestUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof RegelwerkUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof TeamMemberTextStatusUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    if (error instanceof IngameServerStatsUserFacingError) {
      await replyUserFacingError(interaction, error.message);

      return true;
    }

    throw error;
  }

  return false;
}
