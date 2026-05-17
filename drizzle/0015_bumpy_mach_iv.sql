CREATE TABLE "dizzy_abuse_moderator_threshold_clock" (
	"guild_id" text NOT NULL,
	"moderator_user_id" text NOT NULL,
	"count_reports_after" timestamp with time zone DEFAULT '1970-01-01T00:00:00.000Z'::timestamptz NOT NULL,
	CONSTRAINT "dizzy_abuse_moderator_threshold_clock_guild_id_moderator_user_id_pk" PRIMARY KEY("guild_id","moderator_user_id")
);
--> statement-breakpoint
CREATE TABLE "dizzy_abuse_penalties" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"moderator_user_id" text NOT NULL,
	"xp_before" integer NOT NULL,
	"xp_after" integer NOT NULL,
	"trigger_reason" text NOT NULL,
	"reporter_user_ids" text[] NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"announcement_channel_id" text NOT NULL,
	"announcement_message_id" text NOT NULL,
	"reverted_at" timestamp with time zone,
	"reverted_by_discord_user_id" text
);
--> statement-breakpoint
CREATE TABLE "dizzy_control_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"dizzy_control_message_id" text NOT NULL,
	"reporter_discord_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dizzy_control_reports" ADD CONSTRAINT "dizzy_control_reports_dizzy_control_message_id_dizzy_controls_message_id_fk" FOREIGN KEY ("dizzy_control_message_id") REFERENCES "public"."dizzy_controls"("message_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dizzy_control_reports_guild_msg_reporter_uidx" ON "dizzy_control_reports" USING btree ("guild_id","dizzy_control_message_id","reporter_discord_user_id");