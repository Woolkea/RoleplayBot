import { randomUUID } from "node:crypto";

import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";

import type { ButtonInteraction, Client, Message } from "discord.js";

import { MessageFlags } from "discord.js";

import { loadEnv } from "@/config/env.js";

import { RobloxUserNotFoundError } from "@/integrations/roblox/errors.js";

import { resolveRobloxPublicProfileByUsername } from "@/integrations/roblox/users.js";

import type { RobloxPublicProfile } from "@/integrations/roblox/types.js";

import {
  parseDizzyLinkCancelFlowId,
  parseDizzyLinkConfirmFlowId,
} from "@/interactions/custom-ids.js";

import {
  deleteDizzyFlowPending,
  deletePendingFlowsForConfirmUserInGuild,
  getDizzyFlowPendingIfValid,
  insertDizzyFlowPending,
} from "@/repositories/dizzy-flow-pending.js";

import {
  getDizzyLinkStickyState,
  upsertDizzyLinkStickyState,
} from "@/repositories/dizzy-link-sticky-state.js";

import {
  getRobloxLink,
  listDiscordUserIdsByGuildAndRobloxUserId,
  upsertRobloxLink,
} from "@/repositories/roblox-links.js";

import { getLatestDizzyControlForTarget } from "@/repositories/team-xp.js";

import { teamlisteService } from "@/services/teamliste/teamliste-service.js";

import {
  DIZZY_FLOW_EXPIRY_MS,
  DIZZY_FLOW_KIND_SELF_ROBLOX_LINK,
  DIZZY_FLOW_KIND_STAFF_DIZZY_CONFIRM,
  DIZZY_LINK_STICKY_DEBOUNCE_MS,
  DIZZY_ROBLOX_LINK_MAX_AGE_MS,
  DIZZY_STAFF_SLASH_SAME_TARGET_COOLDOWN_MS,
} from "./constants.js";

import {
  buildDizzyLinkStickyContainer,
  buildDizzyRobloxLinkPreviewContainer,
  buildDizzyRobloxLinkResultText,
  dizzyRobloxV2Flags,
} from "./dizzy-roblox-ui-builders.js";

import { TeamXpUserFacingError } from "./team-xp-user-error.js";

import { teamXpService } from "./xp-service.js";

const stickyDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function extractRobloxUsernameFromMessageContent(content: string): string | null {
  const line = content.split(/\r?\n/)[0]?.trim() ?? "";
  const token = (line.split(/\s+/)[0] ?? "").trim();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(token)) {
    return null;
  }

  return token;
}

export type StaffDizzyResolveOk = {
  ok: true;
  targetUserId: string;
  profile: RobloxPublicProfile;
};

export type StaffDizzyResolveErr = {
  ok: false;
  message: string;
  logFehler?: string;
};

export async function resolveStaffDizzyTarget(args: {
  guildId: string;
  robloxUsername: string;
}): Promise<StaffDizzyResolveOk | StaffDizzyResolveErr> {
  const trimmed = args.robloxUsername.trim();

  if (trimmed === "") {
    return {
      ok: false,
      message: "Bitte einen Roblox-Benutzernamen angeben.",
      logFehler: "Kein Roblox-Name.",
    };
  }

  let profile: RobloxPublicProfile;

  try {
    profile = await resolveRobloxPublicProfileByUsername(trimmed);
  } catch (e: unknown) {
    if (e instanceof RobloxUserNotFoundError) {
      return {
        ok: false,
        message: `Roblox-User **${trimmed}** wurde nicht gefunden.`,
        logFehler: "Roblox-User nicht gefunden.",
      };
    }

    throw e;
  }

  const ids = await listDiscordUserIdsByGuildAndRobloxUserId({
    guildId: args.guildId,
    robloxUserId: profile.id,
  });

  if (ids.length === 0) {
    return {
      ok: false,
      message:
        "Niemand hat diesen Roblox-Account verknüpft. Der Spieler muss zuerst im Verknüpfungskanal den Benutzernamen eintragen.",
      logFehler: "Keine Verknüpfung in DB.",
    };
  }

  if (ids.length > 1) {
    return {
      ok: false,
      message:
        "Mehrere Discord-Konten sind mit diesem Roblox-Account verknüpft. Bitte doppelte Verknüpfungen im Verknüpfungskanal bereinigen (nur ein Discord pro Roblox).",
      logFehler: "Mehrdeutige Verknüpfung.",
    };
  }

  const first = ids[0];
  const targetLink = await getRobloxLink({
    guildId: args.guildId,
    discordUserId: first,
  });

  if (targetLink === null) {
    return {
      ok: false,
      message:
        "Niemand hat diesen Roblox-Account verknüpft. Der Spieler muss zuerst im Verknüpfungskanal den Benutzernamen eintragen.",
      logFehler: "Keine Verknüpfung in DB.",
    };
  }

  const linkAge = Date.now() - targetLink.addedAt.getTime();

  if (linkAge >= DIZZY_ROBLOX_LINK_MAX_AGE_MS) {
    return {
      ok: false,
      message:
        "Die Roblox-Verknüpfung dieses Spielers ist älter als 30 Tage. Er muss sie im Verknüpfungskanal neu bestätigen.",
      logFehler: "Verknüpfung >30 Tage.",
    };
  }

  const lastTargetControl = await getLatestDizzyControlForTarget({
    guildId: args.guildId,
    targetUserId: first,
  });

  if (lastTargetControl !== null) {
    const elapsed = Date.now() - lastTargetControl.createdAt.getTime();

    if (elapsed < DIZZY_STAFF_SLASH_SAME_TARGET_COOLDOWN_MS) {
      return {
        ok: false,
        message: "Dieser Spieler wurde gerade schon kontrolliert.",
        logFehler: "Ziel innerhalb 1h schon kontrolliert.",
      };
    }
  }

  return { ok: true, targetUserId: first, profile };
}

export async function createStaffDizzyPendingContainer(args: {
  guildId: string;
  moderatorUserId: string;
  targetUserId: string;
  profile: RobloxPublicProfile;
}): Promise<ContainerBuilder> {
  const flowId = randomUUID();
  const now = new Date();
  await insertDizzyFlowPending({
    flowId,
    guildId: args.guildId,
    kind: DIZZY_FLOW_KIND_STAFF_DIZZY_CONFIRM,
    confirmUserId: args.moderatorUserId,
    targetDiscordUserId: args.targetUserId,
    moderatorDiscordUserId: args.moderatorUserId,
    robloxUserId: args.profile.id,
    robloxUsername: args.profile.name,
    robloxDisplayName: args.profile.displayName,
    robloxHeadshotUrl: args.profile.headshotUrl,
    expiresAt: new Date(now.getTime() + DIZZY_FLOW_EXPIRY_MS),
  });

  return buildDizzyRobloxLinkPreviewContainer({
    flowId,
    profile: args.profile,
    title: "Dizzy-Kontrolle prüfen",
  });
}

function stickyDebounceKey(guildId: string, channelId: string): string {
  return `${guildId}:${channelId}`;
}

export function scheduleDizzyStickyRepost(args: {
  guildId: string;
  channelId: string;
  client: Client;
}): void {
  const key = stickyDebounceKey(args.guildId, args.channelId);
  const existing = stickyDebounceTimers.get(key);

  if (existing !== undefined) {
    clearTimeout(existing);
  }

  stickyDebounceTimers.set(
    key,
    setTimeout(() => {
      stickyDebounceTimers.delete(key);
      void repostDizzyStickyMessage(args).catch((err: unknown) => {
        console.error("dizzy sticky repost failed:", err);
      });
    }, DIZZY_LINK_STICKY_DEBOUNCE_MS),
  );
}

async function repostDizzyStickyMessage(args: {
  guildId: string;
  channelId: string;
  client: Client;
}): Promise<void> {
  const ch = await args.client.channels.fetch(args.channelId);

  if (ch === null || !ch.isTextBased() || ch.isDMBased()) {
    return;
  }

  const state = await getDizzyLinkStickyState(args.guildId);

  if (state !== null && state.stickyMessageId.length > 0) {
    try {
      const old = await ch.messages.fetch(state.stickyMessageId);
      await old.delete();
    } catch {
      // ignored: stale sticky message may already be gone
    }
  }

  const msg = await ch.send({
    flags: dizzyRobloxV2Flags(),
    components: [buildDizzyLinkStickyContainer()],
  });
  await upsertDizzyLinkStickyState({
    guildId: args.guildId,
    channelId: args.channelId,
    stickyMessageId: msg.id,
  });
}

export async function ensureDizzyStickyOnReady(client: Client): Promise<void> {
  const env = loadEnv();
  const channelId = env.dizzyRobloxLinkChannelId;

  if (channelId === undefined) {
    return;
  }

  const ch = await client.channels.fetch(channelId).catch(() => null);

  if (ch === null || !ch.isTextBased() || ch.isDMBased()) {
    console.warn("DIZZY_ROBLOX_LINK_CHANNEL_ID: Kanal nicht gefunden oder kein Guild-Textkanal.");

    return;
  }

  const guildId = ch.guildId;
  const state = await getDizzyLinkStickyState(guildId);

  if (state !== null) {
    try {
      await ch.messages.fetch(state.stickyMessageId);

      return;
    } catch {
      // ignored: message no longer exists or cannot be fetched
    }
  }

  await repostDizzyStickyMessage({ guildId, channelId, client });
}

export async function handleDizzyRobloxLinkChannelMessage(message: Message): Promise<void> {
  const env = loadEnv();
  const linkChannelId = env.dizzyRobloxLinkChannelId;

  if (linkChannelId === undefined || message.channelId !== linkChannelId || !message.inGuild()) {
    return;
  }

  if (message.author.bot || message.webhookId !== null) {
    return;
  }

  const guildId = message.guild.id;
  scheduleDizzyStickyRepost({ guildId, channelId: message.channelId, client: message.client });
  const username = extractRobloxUsernameFromMessageContent(message.content);

  if (username === null) {
    return;
  }

  let profile: RobloxPublicProfile;

  try {
    profile = await resolveRobloxPublicProfileByUsername(username);
  } catch (e: unknown) {
    if (e instanceof RobloxUserNotFoundError) {
      await message.reply({
        content: `Roblox-User **${username}** wurde nicht gefunden.`,
        allowedMentions: { users: [] },
      });

      return;
    }

    throw e;
  }

  const now = new Date();
  await deletePendingFlowsForConfirmUserInGuild({
    guildId,
    confirmUserId: message.author.id,
  });
  const flowId = randomUUID();
  await insertDizzyFlowPending({
    flowId,
    guildId,
    kind: DIZZY_FLOW_KIND_SELF_ROBLOX_LINK,
    confirmUserId: message.author.id,
    targetDiscordUserId: message.author.id,
    moderatorDiscordUserId: null,
    robloxUserId: profile.id,
    robloxUsername: profile.name,
    robloxDisplayName: profile.displayName,
    robloxHeadshotUrl: profile.headshotUrl,
    expiresAt: new Date(now.getTime() + DIZZY_FLOW_EXPIRY_MS),
  });
  await message.reply({
    flags: dizzyRobloxV2Flags(),
    components: [
      buildDizzyRobloxLinkPreviewContainer({
        flowId,
        profile,
        title: "Verknüpfung prüfen",
        actionLine: "**Aktion:** Discord mit Roblox verknüpfen",
        reasonLine: "**Hinweis:** Nur bestätigen, wenn der Account dir gehört.",
      }),
    ],
    allowedMentions: { users: [] },
  });
}

export async function handleDizzyLinkButtonConfirm(interaction: ButtonInteraction): Promise<void> {
  const flowId = parseDizzyLinkConfirmFlowId(interaction.customId);

  if (flowId === undefined) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Ungültige Interaktion.",
    });

    return;
  }

  const now = new Date();
  const pending = await getDizzyFlowPendingIfValid(flowId, now);

  if (pending === null) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Diese Bestätigung ist abgelaufen oder ungültig.",
    });

    return;
  }

  if (pending.confirmUserId !== interaction.user.id) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Nur der vorgesehene Nutzer kann hier bestätigen.",
    });

    return;
  }

  if (pending.kind === DIZZY_FLOW_KIND_SELF_ROBLOX_LINK) {
    await interaction.deferUpdate();
    await upsertRobloxLink({
      guildId: pending.guildId,
      discordUserId: pending.targetDiscordUserId,
      robloxUserId: pending.robloxUserId,
      robloxUsername: pending.robloxUsername,
      robloxDisplayName: pending.robloxDisplayName,
      robloxAvatarUrl: pending.robloxHeadshotUrl,
      robloxCreatedAt: null,
    });
    await deleteDizzyFlowPending(flowId);

    try {
      await teamlisteService.refreshPanel(interaction.client, pending.guildId);
    } catch (err: unknown) {
      console.error("teamliste refresh after dizzy self-link failed:", err);
    }

    const refId = interaction.message.reference?.messageId;
    const ch = interaction.channel;

    if (refId !== undefined && ch !== null && ch.isTextBased()) {
      try {
        const orig = await ch.messages.fetch(refId);

        if (!orig.author.bot) {
          await orig.react("✅");
        }
      } catch (err: unknown) {
        console.error("dizzy self-link: reaction on user message failed:", err);
      }
    }

    try {
      await interaction.message.delete();
    } catch (err: unknown) {
      console.error("dizzy self-link: delete preview message failed:", err);
    }

    return;
  }

  if (pending.kind === DIZZY_FLOW_KIND_STAFF_DIZZY_CONFIRM) {
    await interaction.deferUpdate();
    const modId = pending.moderatorDiscordUserId ?? interaction.user.id;

    try {
      await teamXpService.processDizzyKontrolle({
        client: interaction.client,
        guildId: pending.guildId,
        moderatorUserId: modId,
        targetUserId: pending.targetDiscordUserId,
      });
    } catch (err: unknown) {
      await deleteDizzyFlowPending(flowId);

      if (err instanceof TeamXpUserFacingError) {
        if (err.dizzyKontrolleLogFehler !== undefined) {
          await teamXpService.trySendDizzyKontrolleFehlerLog({
            client: interaction.client,
            moderatorUserId: modId,
            targetUserId: pending.targetDiscordUserId,
            fehlerText: err.dizzyKontrolleLogFehler,
          });
        }

        await interaction.editReply({
          flags: dizzyRobloxV2Flags(),
          components: [
            new ContainerBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                buildDizzyRobloxLinkResultText({ ok: false, text: err.message }),
              ),
            ),
          ],
        });

        return;
      }

      throw err;
    }

    await deleteDizzyFlowPending(flowId);
    await interaction.editReply({
      flags: dizzyRobloxV2Flags(),
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            buildDizzyRobloxLinkResultText({
              ok: true,
              text: "Dizzy-Kontrolle verbucht — **+15 XP**.",
            }),
          ),
        ),
      ],
    });

    return;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: "Unbekannter Flow-Typ.",
  });
}

export async function handleDizzyLinkButtonCancel(interaction: ButtonInteraction): Promise<void> {
  const flowId = parseDizzyLinkCancelFlowId(interaction.customId);

  if (flowId === undefined) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Ungültige Interaktion.",
    });

    return;
  }

  const now = new Date();
  const pending = await getDizzyFlowPendingIfValid(flowId, now);

  if (pending === null) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Dieser Vorgang ist bereits abgelaufen.",
    });

    return;
  }

  if (pending.confirmUserId !== interaction.user.id) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Nur der vorgesehene Nutzer kann abbrechen.",
    });

    return;
  }

  await deleteDizzyFlowPending(flowId);

  if (pending.kind === DIZZY_FLOW_KIND_STAFF_DIZZY_CONFIRM) {
    await interaction.deferUpdate();
    await interaction.editReply({
      flags: dizzyRobloxV2Flags(),
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            buildDizzyRobloxLinkResultText({ ok: false, text: "Abgebrochen." }),
          ),
        ),
      ],
    });

    return;
  }

  await interaction.deferUpdate();
  await interaction.message.edit({
    flags: dizzyRobloxV2Flags(),
    components: [
      new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          buildDizzyRobloxLinkResultText({ ok: false, text: "Abgebrochen." }),
        ),
      ),
    ],
  });
}
