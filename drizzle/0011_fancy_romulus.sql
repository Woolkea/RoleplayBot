CREATE TABLE "team_member_text_status" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"description" text NOT NULL,
	"set_by_discord_user_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_text_status_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team_member_text_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"description" text NOT NULL,
	"set_by_discord_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
