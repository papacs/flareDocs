CREATE TABLE `document_shares` (
  `document_id` integer NOT NULL,
  `owner_user_id` integer NOT NULL,
  `shared_with_user_id` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  PRIMARY KEY(`document_id`, `shared_with_user_id`),
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `document_shares_owner_user_idx` ON `document_shares` (`owner_user_id`);
CREATE INDEX `document_shares_shared_with_user_idx` ON `document_shares` (`shared_with_user_id`);
