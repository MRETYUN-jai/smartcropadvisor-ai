CREATE TABLE `species` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`common_name` text NOT NULL,
	`scientific_name` text NOT NULL,
	`family` text NOT NULL,
	`tags` text,
	`growth_habit` text,
	`lifecycle` text,
	`climate` text,
	`region` text,
	`soil` text,
	`water` text,
	`sunlight` text,
	`spacing` text,
	`sowing_planting` text,
	`fertilization` text,
	`pests` text,
	`diseases` text,
	`management` text,
	`harvest` text,
	`yield` text,
	`seasonality` text,
	`uses` text,
	`image_url` text,
	`language` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_species_category` ON `species` (`category`);--> statement-breakpoint
CREATE INDEX `idx_species_common_name` ON `species` (`common_name`);