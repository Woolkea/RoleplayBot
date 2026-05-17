CREATE TABLE "ingame_server_stats_state" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"panel_message_id" text,
	"owner_display" text DEFAULT '—' NOT NULL,
	"players_current" integer DEFAULT 0 NOT NULL,
	"join_code" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingame_server_stats_team_xp_cooldown" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_awarded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ingame_server_stats_team_xp_cooldown_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
