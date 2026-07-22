CREATE TABLE `game_bans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameId` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_bans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `game_participations` ADD `paymentStatus` enum('none','pending','approved','rejected') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `game_participations` ADD `proofUrl` text;--> statement-breakpoint
ALTER TABLE `game_participations` ADD `failCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `paymentDeadlineDays` int DEFAULT 3;