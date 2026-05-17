UPDATE "ingame_server_stats_state" SET "owner_display" = 'Russilando & Lenny' WHERE "owner_display" = '—';--> statement-breakpoint
ALTER TABLE "ingame_server_stats_state" ALTER COLUMN "owner_display" SET DEFAULT 'Russilando & Lenny';
