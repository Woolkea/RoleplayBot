export type AppEnv = {
  discordToken: string;
  databaseUrl: string;
  discordClientId?: string;
  discordGuildId?: string;
  ingameLogsServer1ChannelId?: string;
  ingameLogsServer2ChannelId?: string;
  feedbackChannelId?: string;
  teamRoleId?: string;
  dizzyControlChannelId?: string;
  dizzyRobloxLinkChannelId?: string;
  dizzyControlLogChannelId?: string;
  dizzyAbuseAnnounceChannelId?: string;
  voiceXpCategory1Id?: string;
  voiceXpCategory2Id?: string;
  robloxApiKey?: string;
  adminCallChannelId?: string;
  adminCallPingRoleId?: string;
  teamXpBoostAnnounceChannelId?: string;
  teamXpBoostPingRoleId?: string;
  teamStatusModRoleId?: string;
  officeRequestWaitVoiceChannelId?: string;
  officeRequestLogChannelId?: string;
  officeRequestStaffVoiceCategoryId?: string;
  ingameServerStatsChannelId?: string;
  ingameServerStatsThumbnailUrl?: string;
  ingameServerStatsBannerUrl?: string;
};

export type CommandRegistrationEnv = {
  discordToken: string;
  discordClientId: string;
  discordGuildId: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

export function loadEnv(): AppEnv {
  return {
    discordToken: requireEnv("DISCORD_TOKEN"),
    databaseUrl: requireEnv("DATABASE_URL"),
    discordClientId: optionalEnv("DISCORD_CLIENT_ID"),
    discordGuildId: optionalEnv("DISCORD_GUILD_ID"),
    ingameLogsServer1ChannelId: optionalEnv("INGAME_LOGS_SERVER_1_CHANNEL_ID"),
    ingameLogsServer2ChannelId: optionalEnv("INGAME_LOGS_SERVER_2_CHANNEL_ID"),
    feedbackChannelId: optionalEnv("FEEDBACK_CHANNEL_ID"),
    teamRoleId: optionalEnv("TEAM_ROLE_ID"),
    dizzyControlChannelId: optionalEnv("DIZZY_CONTROL_CHANNEL_ID"),
    dizzyRobloxLinkChannelId: optionalEnv("DIZZY_ROBLOX_LINK_CHANNEL_ID"),
    dizzyControlLogChannelId: optionalEnv("DIZZY_CONTROL_LOG_CHANNEL_ID"),
    dizzyAbuseAnnounceChannelId: optionalEnv("DIZZY_ABUSE_ANNOUNCE_CHANNEL_ID"),
    voiceXpCategory1Id: optionalEnv("VOICE_XP_CATEGORY_1"),
    voiceXpCategory2Id: optionalEnv("VOICE_XP_CATEGORY_2"),
    robloxApiKey: optionalEnv("ROBLOX_API_KEY"),
    adminCallChannelId: optionalEnv("ADMIN_CALL_CHANNEL_ID"),
    adminCallPingRoleId: optionalEnv("ADMIN_CALL_PING_ROLE_ID"),
    teamXpBoostAnnounceChannelId: optionalEnv("TEAM_XP_BOOST_ANNOUNCE_CHANNEL_ID"),
    teamXpBoostPingRoleId: optionalEnv("TEAM_XP_BOOST_PING_ROLE_ID"),
    teamStatusModRoleId: optionalEnv("TEAM_STATUS_MOD_ROLE_ID"),
    officeRequestWaitVoiceChannelId: optionalEnv("OFFICE_REQUEST_WAIT_VOICE_CHANNEL_ID"),
    officeRequestLogChannelId: optionalEnv("OFFICE_REQUEST_LOG_CHANNEL_ID"),
    officeRequestStaffVoiceCategoryId: optionalEnv("OFFICE_REQUEST_STAFF_VOICE_CATEGORY_ID"),
    ingameServerStatsChannelId: optionalEnv("INGAME_SERVER_STATS_CHANNEL_ID"),
    ingameServerStatsThumbnailUrl: optionalEnv("INGAME_SERVER_STATS_THUMBNAIL_URL"),
    ingameServerStatsBannerUrl: optionalEnv("INGAME_SERVER_STATS_BANNER_URL"),
  };
}

export function loadCommandRegistrationEnv(): CommandRegistrationEnv {
  return {
    discordToken: requireEnv("DISCORD_TOKEN"),
    discordClientId: requireEnv("DISCORD_CLIENT_ID"),
    discordGuildId: requireEnv("DISCORD_GUILD_ID"),
  };
}
