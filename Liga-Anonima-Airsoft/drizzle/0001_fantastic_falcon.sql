CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeItemId` int NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`message` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feed_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`mediaUrls` json,
	`mediaType` enum('none','image','video','mixed') DEFAULT 'none',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feed_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text NOT NULL,
	`gameDate` timestamp NOT NULL,
	`value` decimal(10,2),
	`maxPlayers` int DEFAULT 30,
	`currentPlayers` int DEFAULT 0,
	`status` enum('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mediaUrl` text NOT NULL,
	`mediaType` enum('image','video') NOT NULL,
	`description` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `member_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nickname` text,
	`bio` text,
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `member_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `store_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`images` json,
	`category` enum('replica','acessorio','mascara','colete','luvas','oculos','bb','grenada','outros') NOT NULL,
	`condition` enum('novo','usado','recondicionado') DEFAULT 'usado',
	`status` enum('active','sold','inactive') NOT NULL DEFAULT 'active',
	`buyerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `banned` boolean DEFAULT false NOT NULL;