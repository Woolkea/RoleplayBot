ALTER TABLE "global_xp_boosts" ADD COLUMN "set_by_discord_user_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "global_xp_boosts" ADD COLUMN "bonus_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "global_xp_boosts" ADD COLUMN "duration_hours" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "global_xp_boosts" ADD COLUMN "reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "global_xp_boosts" ADD COLUMN "announcement_channel_id" text;--> statement-breakpoint
ALTER TABLE "global_xp_boosts" ADD COLUMN "announcement_message_id" text;--> statement-breakpoint
ALTER TABLE "global_xp_boosts" ADD COLUMN "expiry_reply_sent_at" timestamp with time zone;