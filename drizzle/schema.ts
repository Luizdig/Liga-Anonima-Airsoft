import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  banned: boolean("banned").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Member profiles - public info about each member
 */
export const memberProfiles = mysqlTable("member_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nickname: text("nickname"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertMemberProfile = typeof memberProfiles.$inferInsert;

/**
 * Member loadout photos - up to 5 photos of member's gear
 */
export const loadoutPhotos = mysqlTable("loadout_photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  caption: text("caption"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoadoutPhoto = typeof loadoutPhotos.$inferSelect;
export type InsertLoadoutPhoto = typeof loadoutPhotos.$inferInsert;

/**
 * Scheduled games/matches
 */
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  gameDate: timestamp("gameDate").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  maxPlayers: int("maxPlayers").default(30),
  currentPlayers: int("currentPlayers").default(0),
  status: mysqlEnum("status", ["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming").notNull(),
  teamsEnabled: boolean("teamsEnabled").default(false),
  paymentDeadlineDays: int("paymentDeadlineDays").default(3),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Game participations - tracks which members participated in which games
 */
export const gameParticipations = mysqlTable("game_participations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameId: int("gameId").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["none", "pending", "approved", "rejected"]).default("none").notNull(),
  proofUrl: text("proofUrl"),
  failCount: int("failCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameParticipation = typeof gameParticipations.$inferSelect;
export type InsertGameParticipation = typeof gameParticipations.$inferInsert;

/**
 * Feed posts by admins
 */
export const feedPosts = mysqlTable("feed_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  mediaUrls: json("mediaUrls"),
  mediaType: mysqlEnum("mediaType", ["none", "image", "video", "mixed"]).default("none"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = typeof feedPosts.$inferInsert;

/**
 * Member media uploads - pending admin approval
 */
export const memberMedia = mysqlTable("member_media", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemberMedia = typeof memberMedia.$inferSelect;
export type InsertMemberMedia = typeof memberMedia.$inferInsert;

/**
 * Honored members - memorial and hall of fame
 */
export const honoredMembers = mysqlTable("honored_members", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  photoUrl: text("photoUrl"),
  biography: text("biography"),
  yearsActive: text("yearsActive"),
  role: text("role"),
  isDeceased: boolean("isDeceased").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HonoredMember = typeof honoredMembers.$inferSelect;
export type InsertHonoredMember = typeof honoredMembers.$inferInsert;

/**
 * Store listings
 */
export const storeItems = mysqlTable("store_items", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: json("images"),
  category: mysqlEnum("category", [
    "replica", "acessorio", "mascara", "colete", "luvas", "oculos",
    "bb", "grenada", "outros"
  ]).notNull(),
  condition: mysqlEnum("condition", ["novo", "usado", "recondicionado"]).default("usado"),
  status: mysqlEnum("status", ["active", "sold", "inactive"]).default("active").notNull(),
  buyerId: int("buyerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreItem = typeof storeItems.$inferSelect;
export type InsertStoreItem = typeof storeItems.$inferInsert;

/**
 * Chat messages between users for store negotiations
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  storeItemId: int("storeItemId").notNull(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * App settings controlled by admins
 */
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;

/**
 * Game PIX payment info - stores PIX key for each game creator
 */
export const gamePixInfo = mysqlTable("game_pix_info", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull().unique(),
  pixKey: text("pixKey").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GamePixInfo = typeof gamePixInfo.$inferSelect;
export type InsertGamePixInfo = typeof gamePixInfo.$inferInsert;

/**
 * Game payment proofs - stores payment proof receipts sent by users
 */
export const gamePaymentProofs = mysqlTable("game_payment_proofs", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  userId: int("userId").notNull(),
  proofUrl: text("proofUrl").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GamePaymentProof = typeof gamePaymentProofs.$inferSelect;
export type InsertGamePaymentProof = typeof gamePaymentProofs.$inferInsert;

/**
 * Game participation status - tracks payment status for each participant
 */
export const gameParticipationStatus = mysqlTable("game_participation_status", {
  id: int("id").autoincrement().primaryKey(),
  participationId: int("participationId").notNull().unique(),
  isPaid: boolean("isPaid").default(false).notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameParticipationStatus = typeof gameParticipationStatus.$inferSelect;
export type InsertGameParticipationStatus = typeof gameParticipationStatus.$inferInsert;

/**
 * Feed media uploads - direct upload without approval
 */
export const feedMediaUploads = mysqlTable("feed_media_uploads", {
  id: int("id").autoincrement().primaryKey(),
  feedPostId: int("feedPostId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedMediaUpload = typeof feedMediaUploads.$inferSelect;
export type InsertFeedMediaUpload = typeof feedMediaUploads.$inferInsert;

/**
 * Profile photos - user profile images without approval
 */
export const profilePhotos = mysqlTable("profile_photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfilePhoto = typeof profilePhotos.$inferSelect;
export type InsertProfilePhoto = typeof profilePhotos.$inferInsert;

/**
 * Gallery media uploads - requires admin approval
 */
export const galleryMediaUploads = mysqlTable("gallery_media_uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryMediaUpload = typeof galleryMediaUploads.$inferSelect;
export type InsertGalleryMediaUpload = typeof galleryMediaUploads.$inferInsert;

/**
 * Game images - direct upload without approval
 */
export const gameImages = mysqlTable("game_images", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameImage = typeof gameImages.$inferSelect;
export type InsertGameImage = typeof gameImages.$inferInsert;

/**
 * Game team assignments - tracks which team each user is on (BDU or PMC)
 */
export const gameTeamAssignments = mysqlTable("game_team_assignments", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  userId: int("userId").notNull(),
  team: mysqlEnum("team", ["BDU", "PMC"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameTeamAssignment = typeof gameTeamAssignments.$inferSelect;
export type InsertGameTeamAssignment = typeof gameTeamAssignments.$inferInsert;

/**
 * Game bans - users banned from specific games (2 failed payment attempts)
 */
export const gameBans = mysqlTable("game_bans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameId: int("gameId").notNull(),
  strikes: int("strikes").default(0).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameBan = typeof gameBans.$inferSelect;
export type InsertGameBan = typeof gameBans.$inferInsert;
