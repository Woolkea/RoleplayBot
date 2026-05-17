export const TEAM_MESSAGE_XP_AMOUNT = 5;

export const TEAM_MESSAGE_XP_COOLDOWN_MS = 60000;

export const TEAM_VOICE_XP_PER_TICK = 1;

export const TEAM_DIZZY_XP_AMOUNT = 15;

export const TEAM_DIZZY_MESSAGE_MAX_AGE_MS = 5 * 60 * 1000;

export const TEAM_DIZZY_TARGET_COOLDOWN_MS = 5 * 60 * 1000;

export const DIZZY_STAFF_SLASH_SAME_TARGET_COOLDOWN_MS = 60 * 60 * 1000;

export const DIZZY_LINK_STICKY_DEBOUNCE_MS = 3000;

export const DIZZY_ROBLOX_LINK_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const DIZZY_FLOW_EXPIRY_MS = 30 * 60 * 1000;

export const DIZZY_FLOW_KIND_SELF_ROBLOX_LINK = "self_roblox_link" as const;

export const DIZZY_FLOW_KIND_STAFF_DIZZY_CONFIRM = "staff_dizzy_confirm" as const;

export const TEAM_LEADERBOARD_PAGE_SIZE = 5;

export const TEAM_FEEDBACK_XP_BY_STAR: Record<string, number> = {
  "5": 10,
  "4": 8,
};

export const DEFAULT_VOICE_XP_CATEGORY_1_ID = "1445467870535483464";

export const DEFAULT_VOICE_XP_CATEGORY_2_ID = "1445467872305479713";

export const DEFAULT_TEAM_XP_BOOST_PING_ROLE_ID = "1445467714997981346";

export const VOICE_CHANNEL_PAUSE_NAME_SUBSTRING = "𝑷𝒂𝒖𝒔𝒆";

export const TEAM_XP_BOOST_REASON_MAX_LENGTH = 300;
