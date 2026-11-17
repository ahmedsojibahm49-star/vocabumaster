ALTER TABLE `students` ADD COLUMN `book_access` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE `book_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`page` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
