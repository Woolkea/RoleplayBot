CREATE TABLE "dizzy_flow_pending" (
	"flow_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"kind" text NOT NULL,
	"confirm_user_id" text NOT NULL,
	"target_discord_user_id" text NOT NULL,
	"moderator_discord_user_id" text,
	"roblox_user_id" text NOT NULL,
	"roblox_username" text NOT NULL,
	"roblox_display_name" text NOT NULL,
	"roblox_headshot_url" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dizzy_link_sticky_state" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"sticky_message_id" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "roblox_links_guild_roblox_user_idx" ON "roblox_links" USING btree ("guild_id","roblox_user_id");