CREATE TABLE "dizzy_controls" (
	"message_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"moderator_discord_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_xp_boosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"multiplier" real NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_xp" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	CONSTRAINT "team_xp_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
