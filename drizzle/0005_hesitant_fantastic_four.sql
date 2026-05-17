CREATE TABLE "teamliste_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"roles" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teamliste_config" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL
);
