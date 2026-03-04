PRAGMA foreign_keys=OFF;

CREATE TABLE `spaces__new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `visibility` text DEFAULT 'team' NOT NULL CHECK(`visibility` IN ('private', 'team', 'public')),
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

INSERT INTO `spaces__new` (`id`, `name`, `slug`, `visibility`, `created_by`, `created_at`)
SELECT `id`, `name`, `slug`, `visibility`, `created_by`, `created_at`
FROM `spaces`;

DROP TABLE `spaces`;
ALTER TABLE `spaces__new` RENAME TO `spaces`;
CREATE UNIQUE INDEX `spaces_slug_unique` ON `spaces` (`slug`);

PRAGMA foreign_keys=ON;
