CREATE TABLE "admin_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"author_discord_user_id" text NOT NULL,
	"roblox_user_id" text NOT NULL,
	"roblox_username" text NOT NULL,
	"roblox_display_name" text NOT NULL,
	"server_shard" text NOT NULL,
	"location" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"claimed_by_discord_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
