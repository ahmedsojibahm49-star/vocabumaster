ALTER TABLE `course_lessons` ADD COLUMN `video_blob_key` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `course_lessons` ADD COLUMN `video_name` text DEFAULT '' NOT NULL;
