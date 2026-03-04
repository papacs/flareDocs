PRAGMA foreign_keys = ON;

CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `username` text NOT NULL,
  `password_hash` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);

CREATE TABLE `spaces` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `visibility` text DEFAULT 'team' NOT NULL CHECK(`visibility` IN ('team', 'public')),
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX `spaces_slug_unique` ON `spaces` (`slug`);

CREATE TABLE `space_members` (
  `space_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `role_in_space` text NOT NULL CHECK(`role_in_space` IN ('admin', 'editor', 'viewer')),
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  PRIMARY KEY(`space_id`, `user_id`),
  FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `documents` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `space_id` integer NOT NULL,
  `title` text NOT NULL,
  `content` text DEFAULT '' NOT NULL,
  `parent_id` integer,
  `is_folder` integer DEFAULT 0 NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `created_by` integer,
  `updated_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`parent_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `documents_space_parent_idx` ON `documents` (`space_id`, `parent_id`);
CREATE INDEX `documents_space_updated_at_idx` ON `documents` (`space_id`, `updated_at`);

CREATE TABLE `audit_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `space_id` integer,
  `user_id` integer,
  `action` text NOT NULL,
  `target_type` text,
  `target_id` integer,
  `meta` text,
  `ip` text,
  `user_agent` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `audit_logs_space_created_at_idx` ON `audit_logs` (`space_id`, `created_at`);
CREATE INDEX `audit_logs_user_created_at_idx` ON `audit_logs` (`user_id`, `created_at`);
