CREATE TABLE `game_participation_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participationId` int NOT NULL,
	`isPaid` boolean NOT NULL DEFAULT false,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_participation_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_participation_status_participationId_unique` UNIQUE(`participationId`)
);
--> statement-breakpoint
CREATE TABLE `game_payment_proofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`userId` int NOT NULL,
	`proofUrl` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_payment_proofs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_pix_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`pixKey` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_pix_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_pix_info_gameId_unique` UNIQUE(`gameId`)
);
