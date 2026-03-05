ALTER TABLE `users` ADD COLUMN `is_active` integer DEFAULT 1 NOT NULL;

UPDATE `users`
SET `is_active` = 1
WHERE `username` = 'admin';
