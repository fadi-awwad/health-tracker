CREATE TABLE `blood_pressures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`measured_at` integer NOT NULL,
	`systolic` integer NOT NULL,
	`diastolic` integer NOT NULL,
	`pulse` integer,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bp_user_time` ON `blood_pressures` (`user_id`,`measured_at`);--> statement-breakpoint
CREATE TABLE `injections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`taken_at` integer NOT NULL,
	`dose_mg` real NOT NULL,
	`site` text,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `injections_user_time` ON `injections` (`user_id`,`taken_at`);--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`measured_at` integer NOT NULL,
	`waist_cm` real,
	`hips_cm` real,
	`chest_cm` real,
	`neck_cm` real,
	`arm_cm` real,
	`thigh_cm` real,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `measurements_user_time` ON `measurements` (`user_id`,`measured_at`);--> statement-breakpoint
CREATE TABLE `med_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`medication_id` integer NOT NULL,
	`date` text NOT NULL,
	`slot` integer DEFAULT 0 NOT NULL,
	`taken_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `med_logs_unique` ON `med_logs` (`medication_id`,`date`,`slot`);--> statement-breakpoint
CREATE TABLE `medications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`dose` text,
	`times_per_day` integer DEFAULT 1 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`timezone` text DEFAULT 'Asia/Jerusalem' NOT NULL,
	`height_cm` real,
	`goal_weight_kg` real,
	`tracks_injection` integer DEFAULT false NOT NULL,
	`injection_name` text DEFAULT 'Mounjaro' NOT NULL,
	`injection_interval_days` integer DEFAULT 7 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `weights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`measured_at` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `weights_user_time` ON `weights` (`user_id`,`measured_at`);--> statement-breakpoint
CREATE TABLE `wellbeing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`recorded_at` integer NOT NULL,
	`overall` integer NOT NULL,
	`energy` integer,
	`appetite` integer,
	`symptoms` text DEFAULT '{}' NOT NULL,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wellbeing_user_time` ON `wellbeing` (`user_id`,`recorded_at`);