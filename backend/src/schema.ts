import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const words = sqliteTable("words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull(),
  pos: text("pos").notNull().default(""),
  level: text("level").notNull(),
  bn: text("bn").notNull().default(""),
  bnPron: text("bn_pron").notNull().default(""),
  respUs: text("resp_us").notNull().default(""),
  respUk: text("resp_uk").notNull().default(""),
  syn: text("syn").notNull().default(""),
  ant: text("ant").notNull().default(""),
  ex: text("ex").notNull().default(""),
  exBn: text("ex_bn").notNull().default(""),
  sort: integer("sort").notNull().default(0),
});

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  price: integer("price"),
  oldPrice: integer("old_price"),
  lessons: integer("lessons"),
  features: text("features").notNull().default(""),
  badge: text("badge").notNull().default(""),
  accessMode: text("access_mode").notNull().default("paid"),
  imageBlobKey: text("image_blob_key").notNull().default(""),
  published: integer("published").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const grammarLessons = sqliteTable("grammar_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titleBn: text("title_bn").notNull(),
  titleEn: text("title_en").notNull().default(""),
  category: text("category").notNull().default(""),
  level: text("level").notNull().default(""),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull().default(""),
  premium: integer("premium").notNull().default(0),
  bookAccess: integer("book_access").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastDaily: text("last_daily"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  wordId: integer("word_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const learned = sqliteTable("learned", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  wordId: integer("word_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const quizResults = sqliteTable("quiz_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id"),
  kind: text("kind").notNull(),
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id"),
  courseTitle: text("course_title").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  method: text("method").notNull().default(""),
  txnId: text("txn_id").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const courseLessons = sqliteTable("course_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("text"),
  videoUrl: text("video_url").notNull().default(""),
  videoBlobKey: text("video_blob_key").notNull().default(""),
  videoName: text("video_name").notNull().default(""),
  body: text("body").notNull().default(""),
  freePreview: integer("free_preview").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const lessonAttachments = sqliteTable("lesson_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lessonId: integer("lesson_id").notNull(),
  name: text("name").notNull(),
  blobKey: text("blob_key").notNull(),
  mimeType: text("mime_type").notNull().default(""),
  sizeBytes: integer("size_bytes").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const bookProgress = sqliteTable("book_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  page: integer("page").notNull().default(1),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const studentLevelGrants = sqliteTable("student_level_grants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  level: text("level").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const bookBookmarks = sqliteTable("book_bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  page: integer("page").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const lessonProgress = sqliteTable("lesson_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
