CREATE TABLE "feedback_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"author_discord_user_id" text NOT NULL,
	"target_discord_user_id" text NOT NULL,
	"category" text NOT NULL,
	"stars" text NOT NULL,
	"reason" text NOT NULL,
	"message_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
