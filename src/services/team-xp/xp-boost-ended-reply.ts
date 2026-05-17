import type { Client, GuildTextBasedChannel } from "discord.js";

import { ChannelType } from "discord.js";

import { loadEnv } from "@/config/env.js";

import type { GlobalXpBoostAnnouncementRow } from "@/repositories/team-xp.js";

import { markGlobalXpBoostExpiryReplySent } from "@/repositories/team-xp.js";

import { DEFAULT_TEAM_XP_BOOST_PING_ROLE_ID } from "./constants.js";

import {
  buildXpBoostAnnouncementContainer,
  buildXpBoostEndedReplyContainer,
  buildXpBoostRolePingTextDisplay,
} from "./xp-boost-ui-builders.js";

import { teamXpV2Flags } from "./ui-builders.js";

export async function sendXpBoostEndedReply(
  client: Client,
  row: GlobalXpBoostAnnouncementRow,
  at: Date,
): Promise<void> {
  try {
    const ch = await client.channels.fetch(row.announcementChannelId);

    if (
      ch === null ||
      (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildAnnouncement)
    ) {
      await markGlobalXpBoostExpiryReplySent({ id: row.id, at });

      return;
    }

    const textCh = ch as GuildTextBasedChannel;
    const msg = await textCh.messages.fetch(row.announcementMessageId).catch(() => null);

    if (msg === null) {
      await markGlobalXpBoostExpiryReplySent({ id: row.id, at });

      return;
    }

    const env = loadEnv();
    const pingRoleId =
      env.teamXpBoostPingRoleId !== undefined && env.teamXpBoostPingRoleId.trim() !== ""
        ? env.teamXpBoostPingRoleId.trim()
        : DEFAULT_TEAM_XP_BOOST_PING_ROLE_ID;
    const struckContainer = buildXpBoostAnnouncementContainer({
      percent: row.bonusPercent,
      durationHours: row.durationHours,
      setterUserId: row.setByDiscordUserId,
      reason: row.reason,
      titleStrikethrough: true,
    });

    try {
      await msg.edit({
        flags: teamXpV2Flags(),
        components: [buildXpBoostRolePingTextDisplay(pingRoleId), struckContainer],
      });
    } catch (editErr: unknown) {
      console.error("xp boost announcement strikethrough edit failed", row.id, editErr);
    }

    await msg.reply({
      flags: teamXpV2Flags(),
      components: [buildXpBoostEndedReplyContainer()],
      allowedMentions: { parse: [] },
    });
    await markGlobalXpBoostExpiryReplySent({ id: row.id, at });
  } catch (err: unknown) {
    console.error("xp boost ended reply failed", row.id, err);
    await markGlobalXpBoostExpiryReplySent({ id: row.id, at });
  }
}
