CREATE TABLE "roblox_links" (
	"guild_id" text NOT NULL,
	"discord_user_id" text NOT NULL,
	"roblox_user_id" text NOT NULL,
	"roblox_username" text NOT NULL,
	"roblox_display_name" text NOT NULL,
	"roblox_avatar_url" text,
	"roblox_created_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roblox_links_guild_id_discord_user_id_pk" PRIMARY KEY("guild_id","discord_user_id")
);
