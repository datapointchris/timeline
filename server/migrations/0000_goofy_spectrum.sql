-- Bridge migration: this is the initial Drizzle migration applied against a
-- codebase that previously created the same schema via raw `CREATE TABLE IF NOT
-- EXISTS` calls in server/src/db/index.ts. Every CREATE here uses IF NOT EXISTS
-- so the migration is a no-op against pre-existing dev databases — Drizzle
-- still records it as applied in __drizzle_migrations, and future migrations
-- run normally without this exception.
CREATE TABLE IF NOT EXISTS `event_tags` (
	`event_id` text NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`event_id`, `tag_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_event_tags_event` ON `event_tags` (`event_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_event_tags_tag` ON `event_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`details` text,
	`date_start` text,
	`date_end` text,
	`date_precision` text,
	`date_display` text,
	`is_bce` integer DEFAULT 0,
	`type` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_events_date` ON `events` (`date_start`,`is_bce`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_events_type` ON `events` (`type`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`type` text,
	`url` text NOT NULL,
	`caption` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_media_event` ON `media` (`event_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `relationships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`type` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`source_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `relationships_source_target_type_unique` ON `relationships` (`source_id`,`target_id`,`type`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_relationships_source` ON `relationships` (`source_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_relationships_target` ON `relationships` (`target_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_relationships_type` ON `relationships` (`type`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `tags_name_unique` ON `tags` (`name`);
