CREATE TABLE "office_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"requester_discord_user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"log_channel_id" text NOT NULL,
	"log_message_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"claimed_by_discord_user_id" text,
	"claimed_by_display_name" text,
	"claimed_at" timestamp with time zone
);
