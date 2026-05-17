ALTER TABLE "teamliste_config" ADD COLUMN "panel_message_ids" text NOT NULL DEFAULT '[]';
UPDATE "teamliste_config" SET "panel_message_ids" = json_build_array("message_id")::text;
ALTER TABLE "teamliste_config" DROP COLUMN "message_id";
