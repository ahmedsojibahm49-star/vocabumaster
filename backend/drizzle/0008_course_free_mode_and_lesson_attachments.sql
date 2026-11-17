ALTER TABLE `courses` ADD COLUMN `access_mode` text DEFAULT 'paid' NOT NULL;
--> statement-breakpoint
CREATE TABLE `lesson_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` integer NOT NULL,
	`name` text NOT NULL,
	`blob_key` text NOT NULL,
	`mime_type` text DEFAULT '' NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
