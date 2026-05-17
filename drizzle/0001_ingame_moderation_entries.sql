CREATE TABLE "ingame_moderation_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"server_shard" text NOT NULL,
	"target_roblox_user_id" text NOT NULL,
	"target_display_name" text NOT NULL,
	"target_username" text NOT NULL,
	"moderator_discord_user_id" text NOT NULL,
	"action" text NOT NULL,
	"duration_days" integer,
	"is_permanent" boolean DEFAULT false NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
