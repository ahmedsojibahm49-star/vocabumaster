CREATE TABLE `student_level_grants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`level` text NOT NULL,
	`created_at` integer NOT NULL
);
