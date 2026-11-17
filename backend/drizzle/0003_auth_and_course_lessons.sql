ALTER TABLE students ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE course_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  video_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  free_preview INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX course_lessons_course_idx ON course_lessons (course_id, sort_order);
--> statement-breakpoint
CREATE TABLE lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX lesson_progress_student_idx ON lesson_progress (student_id);
