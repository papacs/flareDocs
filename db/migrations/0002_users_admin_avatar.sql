ALTER TABLE `users` ADD COLUMN `avatar_id` text DEFAULT 'qq-classic-01' NOT NULL;
ALTER TABLE `users` ADD COLUMN `is_system_admin` integer DEFAULT 0 NOT NULL;

UPDATE `users`
SET `is_system_admin` = 1
WHERE `username` = 'admin';
