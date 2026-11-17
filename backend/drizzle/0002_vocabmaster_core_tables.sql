DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  pos TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL,
  bn TEXT NOT NULL DEFAULT '',
  bn_pron TEXT NOT NULL DEFAULT '',
  resp_us TEXT NOT NULL DEFAULT '',
  resp_uk TEXT NOT NULL DEFAULT '',
  syn TEXT NOT NULL DEFAULT '',
  ant TEXT NOT NULL DEFAULT '',
  ex TEXT NOT NULL DEFAULT '',
  ex_bn TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX words_level_idx ON words (level, sort);
--> statement-breakpoint
CREATE INDEX words_word_idx ON words (word);
--> statement-breakpoint
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  price INTEGER,
  old_price INTEGER,
  lessons INTEGER,
  features TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE grammar_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_daily TEXT,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (student_id, word_id)
);
--> statement-breakpoint
CREATE TABLE learned (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (student_id, word_id)
);
--> statement-breakpoint
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  kind TEXT NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER,
  course_title TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT '',
  txn_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
