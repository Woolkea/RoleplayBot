CREATE TABLE "team_xp_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"xp" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
