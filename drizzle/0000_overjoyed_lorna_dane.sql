DO $$ BEGIN
 CREATE TYPE "public"."category" AS ENUM('replica', 'acessorio', 'mascara', 'colete', 'luvas', 'oculos', 'bb', 'grenada', 'outros');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."condition" AS ENUM('novo', 'usado', 'recondicionado');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."mediaType_feed" AS ENUM('none', 'image', 'video', 'mixed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."mediaType_feed_upload" AS ENUM('image', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."mediaType_gallery" AS ENUM('image', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."mediaType_member" AS ENUM('image', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."paymentStatus" AS ENUM('none', 'pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('upcoming', 'ongoing', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_approval" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_gallery" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_payment_proof" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_store" AS ENUM('active', 'sold', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."team" AS ENUM('BDU', 'PMC');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" text,
	"description" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeItemId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_media_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedPostId" integer NOT NULL,
	"mediaUrl" text NOT NULL,
	"mediaType" "mediaType_feed_upload" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"mediaUrls" jsonb,
	"mediaType" "mediaType_feed" DEFAULT 'none',
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_media_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"mediaUrl" text NOT NULL,
	"mediaType" "mediaType_gallery" NOT NULL,
	"description" text,
	"status" "status_gallery" DEFAULT 'pending' NOT NULL,
	"approvedBy" integer,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_bans" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"gameId" integer NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_participation_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"participationId" integer NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_participation_status_participationId_unique" UNIQUE("participationId")
);
--> statement-breakpoint
CREATE TABLE "game_participations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"gameId" integer NOT NULL,
	"paymentStatus" "paymentStatus" DEFAULT 'none' NOT NULL,
	"proofUrl" text,
	"failCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_payment_proofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameId" integer NOT NULL,
	"userId" integer NOT NULL,
	"proofUrl" text NOT NULL,
	"status" "status_payment_proof" DEFAULT 'pending' NOT NULL,
	"approvedBy" integer,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_pix_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameId" integer NOT NULL,
	"pixKey" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_pix_info_gameId_unique" UNIQUE("gameId")
);
--> statement-breakpoint
CREATE TABLE "game_team_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameId" integer NOT NULL,
	"userId" integer NOT NULL,
	"team" "team" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text NOT NULL,
	"gameDate" timestamp NOT NULL,
	"value" numeric(10, 2),
	"imageUrl" text,
	"maxPlayers" integer DEFAULT 30,
	"currentPlayers" integer DEFAULT 0,
	"status" "status" DEFAULT 'upcoming' NOT NULL,
	"teamsEnabled" boolean DEFAULT false,
	"paymentDeadlineDays" integer DEFAULT 3,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "honored_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nickname" text,
	"photoUrl" text,
	"biography" text,
	"yearsActive" text,
	"role" text,
	"isDeceased" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loadout_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"photoUrl" text NOT NULL,
	"caption" text,
	"orderIndex" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"mediaUrl" text NOT NULL,
	"mediaType" "mediaType_member" NOT NULL,
	"description" text,
	"status" "status_approval" DEFAULT 'pending' NOT NULL,
	"approvedBy" integer,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nickname" text,
	"bio" text,
	"avatarUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"photoUrl" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sellerId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"images" jsonb,
	"category" "category" NOT NULL,
	"condition" "condition" DEFAULT 'usado',
	"status" "status_store" DEFAULT 'active' NOT NULL,
	"buyerId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
