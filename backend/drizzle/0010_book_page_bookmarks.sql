CREATE TABLE `book_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`page` integer NOT NULL,
	`created_at` integer NOT NULL
);
