CREATE TABLE `game_participations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_participations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `honored_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`nickname` text,
	`photoUrl` text,
	`biography` text,
	`yearsActive` text,
	`role` text,
	`isDeceased` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `honored_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loadout_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`caption` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loadout_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `games` ADD `imageUrl` text;