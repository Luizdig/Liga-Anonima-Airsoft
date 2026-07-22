CREATE TABLE `game_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_team_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`userId` int NOT NULL,
	`team` enum('BDU','PMC') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_team_assignments_id` PRIMARY KEY(`id`)
);
