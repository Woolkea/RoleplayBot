import { sql } from "drizzle-orm";

import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ingameModerationEntries = pgTable("ingame_moderation_entries", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  serverShard: text("server_shard").notNull(),
  targetRobloxUserId: text("target_roblox_user_id").notNull(),
  targetDisplayName: text("target_display_name").notNull(),
  targetUsername: text("target_username").notNull(),
  moderatorDiscordUserId: text("moderator_discord_user_id").notNull(),
  action: text("action").notNull(),
  durationDays: integer("duration_days"),
  isPermanent: boolean("is_permanent").notNull().default(false),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedbackEntries = pgTable("feedback_entries", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  authorDiscordUserId: text("author_discord_user_id").notNull(),
  targetDiscordUserId: text("target_discord_user_id").notNull(),
  category: text("category").notNull(),
  stars: text("stars").notNull(),
  reason: text("reason").notNull(),
  messageUrl: text("message_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamXp = pgTable(
  "team_xp",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    xp: integer("xp").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.userId] })],
);

export const dizzyControls = pgTable("dizzy_controls", {
  messageId: text("message_id").primaryKey(),
  guildId: text("guild_id").notNull(),
  targetUserId: text("target_user_id").notNull(),
  moderatorDiscordUserId: text("moderator_discord_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dizzyControlReports = pgTable(
  "dizzy_control_reports",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    dizzyControlMessageId: text("dizzy_control_message_id")
      .notNull()
      .references(() => dizzyControls.messageId),
    reporterDiscordUserId: text("reporter_discord_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("dizzy_control_reports_guild_msg_reporter_uidx").on(
      t.guildId,
      t.dizzyControlMessageId,
      t.reporterDiscordUserId,
    ),
  ],
);

export const dizzyAbuseModeratorThresholdClock = pgTable(
  "dizzy_abuse_moderator_threshold_clock",
  {
    guildId: text("guild_id").notNull(),
    moderatorUserId: text("moderator_user_id").notNull(),
    countReportsAfter: timestamp("count_reports_after", { withTimezone: true })
      .notNull()
      .default(sql`'1970-01-01T00:00:00.000Z'::timestamptz`),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.moderatorUserId] })],
);

export const dizzyAbusePenalties = pgTable("dizzy_abuse_penalties", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  moderatorUserId: text("moderator_user_id").notNull(),
  xpBefore: integer("xp_before").notNull(),
  xpAfter: integer("xp_after").notNull(),
  triggerReason: text("trigger_reason").notNull(),
  reporterUserIds: text("reporter_user_ids").array().notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  announcementChannelId: text("announcement_channel_id"),
  announcementMessageId: text("announcement_message_id"),
  revertedAt: timestamp("reverted_at", { withTimezone: true }),
  revertedByDiscordUserId: text("reverted_by_discord_user_id"),
});

export const globalXpBoosts = pgTable("global_xp_boosts", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  multiplier: real("multiplier").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  setByDiscordUserId: text("set_by_discord_user_id").notNull().default(""),
  bonusPercent: integer("bonus_percent").notNull().default(0),
  durationHours: integer("duration_hours").notNull().default(0),
  reason: text("reason").notNull().default(""),
  announcementChannelId: text("announcement_channel_id"),
  announcementMessageId: text("announcement_message_id"),
  expiryReplySentAt: timestamp("expiry_reply_sent_at", { withTimezone: true }),
});

export const teamXpHistory = pgTable("team_xp_history", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  xp: integer("xp").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamMemberTextStatus = pgTable(
  "team_member_text_status",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    description: text("description").notNull(),
    setByDiscordUserId: text("set_by_discord_user_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.userId] })],
);

export const teamMemberTextStatusHistory = pgTable("team_member_text_status_history", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  description: text("description").notNull(),
  setByDiscordUserId: text("set_by_discord_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamlisteCategories = pgTable("teamliste_categories", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  roles: text("roles").array().notNull(),
});

export const teamlisteConfig = pgTable("teamliste_config", {
  guildId: text("guild_id").primaryKey(),
  channelId: text("channel_id").notNull(),
  panelMessageIdsJson: text("panel_message_ids").notNull().default("[]"),
});

export const robloxLinks = pgTable(
  "roblox_links",
  {
    guildId: text("guild_id").notNull(),
    discordUserId: text("discord_user_id").notNull(),
    robloxUserId: text("roblox_user_id").notNull(),
    robloxUsername: text("roblox_username").notNull(),
    robloxDisplayName: text("roblox_display_name").notNull(),
    robloxAvatarUrl: text("roblox_avatar_url"),
    robloxCreatedAt: timestamp("roblox_created_at", { withTimezone: true }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.guildId, t.discordUserId] }),
    index("roblox_links_guild_roblox_user_idx").on(t.guildId, t.robloxUserId),
  ],
);

export const dizzyLinkStickyState = pgTable("dizzy_link_sticky_state", {
  guildId: text("guild_id").primaryKey(),
  channelId: text("channel_id").notNull(),
  stickyMessageId: text("sticky_message_id").notNull(),
});

export const dizzyFlowPending = pgTable("dizzy_flow_pending", {
  flowId: text("flow_id").primaryKey(),
  guildId: text("guild_id").notNull(),
  kind: text("kind").notNull(),
  confirmUserId: text("confirm_user_id").notNull(),
  targetDiscordUserId: text("target_discord_user_id").notNull(),
  moderatorDiscordUserId: text("moderator_discord_user_id"),
  robloxUserId: text("roblox_user_id").notNull(),
  robloxUsername: text("roblox_username").notNull(),
  robloxDisplayName: text("roblox_display_name").notNull(),
  robloxHeadshotUrl: text("roblox_headshot_url").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminCalls = pgTable("admin_calls", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  authorDiscordUserId: text("author_discord_user_id").notNull(),
  robloxUserId: text("roblox_user_id").notNull(),
  robloxUsername: text("roblox_username").notNull(),
  robloxDisplayName: text("roblox_display_name").notNull(),
  robloxAvatarUrl: text("roblox_avatar_url"),
  serverShard: text("server_shard").notNull(),
  location: text("location").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  claimedByDiscordUserId: text("claimed_by_discord_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officeRequests = pgTable("office_requests", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  requesterDiscordUserId: text("requester_discord_user_id").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  logChannelId: text("log_channel_id"),
  logMessageId: text("log_message_id"),
  status: text("status").notNull().default("open"),
  claimedByDiscordUserId: text("claimed_by_discord_user_id"),
  claimedByDisplayName: text("claimed_by_display_name"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
});

export const ingameServerStatsState = pgTable("ingame_server_stats_state", {
  guildId: text("guild_id").primaryKey(),
  panelMessageId: text("panel_message_id"),
  ownerDisplay: text("owner_display").notNull().default("Russilando & Lenny"),
  playersCurrent: integer("players_current").notNull().default(0),
  joinCode: text("join_code").notNull().default(""),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }),
  lastUpdatedByDiscordUserId: text("last_updated_by_discord_user_id"),
});

export const ingameServerStatsTeamXpCooldown = pgTable(
  "ingame_server_stats_team_xp_cooldown",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    lastAwardedAt: timestamp("last_awarded_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.userId] })],
);
