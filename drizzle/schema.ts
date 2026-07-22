import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: pgEnum("role", ["user", "admin"])("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  banned: boolean("banned").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Member profiles - public info about each member
 */
export const memberProfiles = pgTable("member_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertMemberProfile = typeof memberProfiles.$inferInsert;

/**
 * Member loadout photos - up to 5 photos of member's gear
 */
export const loadoutPhotos = pgTable("loadout_photos", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  photoUrl: text("photoUrl").notNull(),
  caption: text("caption"),
  orderIndex: integer("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoadoutPhoto = typeof loadoutPhotos.$inferSelect;
export type InsertLoadoutPhoto = typeof loadoutPhotos.$inferInsert;

/**
 * Scheduled games/matches
 */
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  gameDate: timestamp("gameDate").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  maxPlayers: integer("maxPlayers").default(30),
  currentPlayers: integer("currentPlayers").default(0),
  status: pgEnum("status", ["upcoming", "ongoing", "completed", "cancelled"])("status").default("upcoming").notNull(),
  teamsEnabled: boolean("teamsEnabled").default(false),
  paymentDeadlineDays: integer("paymentDeadlineDays").default(3),
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Game participations - tracks which members participated in which games
 */
export const gameParticipations = pgTable("game_participations", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  paymentStatus: pgEnum("paymentStatus", ["none", "pending", "approved", "rejected"])("paymentStatus").default("none").notNull(),
  proofUrl: text("proofUrl"),
  failCount: integer("failCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameParticipation = typeof gameParticipations.$inferSelect;
export type InsertGameParticipation = typeof gameParticipations.$inferInsert;

/**
 * Feed posts by admins
 */
export const feedPosts = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  mediaUrls: jsonb("mediaUrls"),
  mediaType: pgEnum("mediaType_feed", ["none", "image", "video", "mixed"])("mediaType").default("none"),
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = typeof feedPosts.$inferInsert;

/**
 * Member media uploads - pending admin approval
 */
export const memberMedia = pgTable("member_media", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: pgEnum("mediaType_member", ["image", "video"])("mediaType").notNull(),
  description: text("description"),
  status: pgEnum("status_approval", ["pending", "approved", "rejected"])("status").default("pending").notNull(),
  approvedBy: integer("approvedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemberMedia = typeof memberMedia.$inferSelect;
export type InsertMemberMedia = typeof memberMedia.$inferInsert;

/**
 * Honored members - memorial and hall of fame
 */
export const honoredMembers = pgTable("honored_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  photoUrl: text("photoUrl"),
  biography: text("biography"),
  yearsActive: text("yearsActive"),
  role: text("role"),
  isDeceased: boolean("isDeceased").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type HonoredMember = typeof honoredMembers.$inferSelect;
export type InsertHonoredMember = typeof honoredMembers.$inferInsert;

/**
 * Store listings
 */
export const storeItems = pgTable("store_items", {
  id: serial("id").primaryKey(),
  sellerId: integer("sellerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: jsonb("images"),
  category: pgEnum("category", [
    "replica", "acessorio", "mascara", "colete", "luvas", "oculos",
    "bb", "grenada", "outros"
  ])("category").notNull(),
  condition: pgEnum("condition", ["novo", "usado", "recondicionado"])("condition").default("usado"),
  status: pgEnum("status_store", ["active", "sold", "inactive"])("status").default("active").notNull(),
  buyerId: integer("buyerId").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StoreItem = typeof storeItems.$inferSelect;
export type InsertStoreItem = typeof storeItems.$inferInsert;

/**
 * Chat messages between users for store negotiations
 */
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  storeItemId: integer("storeItemId")
    .notNull()
    .references(() => storeItems.id, { onDelete: "cascade" }),
  senderId: integer("senderId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiverId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * App settings controlled by admins
 */
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;

/**
 * Game PIX payment info - stores PIX key for each game creator
 */
export const gamePixInfo = pgTable("game_pix_info", {
  id: serial("id").primaryKey(),
  gameId: integer("gameId")
    .notNull()
    .unique()
    .references(() => games.id, { onDelete: "cascade" }),
  pixKey: text("pixKey").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GamePixInfo = typeof gamePixInfo.$inferSelect;
export type InsertGamePixInfo = typeof gamePixInfo.$inferInsert;

/**
 * Game payment proofs - stores payment proof receipts sent by users
 */
export const gamePaymentProofs = pgTable("game_payment_proofs", {
  id: serial("id").primaryKey(),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  proofUrl: text("proofUrl").notNull(),
  status: pgEnum("status_payment_proof", ["pending", "approved", "rejected"])("status").default("pending").notNull(),
  approvedBy: integer("approvedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GamePaymentProof = typeof gamePaymentProofs.$inferSelect;
export type InsertGamePaymentProof = typeof gamePaymentProofs.$inferInsert;

/**
 * Game participation status - tracks payment status for each participant
 */
export const gameParticipationStatus = pgTable("game_participation_status", {
  id: serial("id").primaryKey(),
  participationId: integer("participationId")
    .notNull()
    .unique()
    .references(() => gameParticipations.id, { onDelete: "cascade" }),
  isPaid: boolean("isPaid").default(false).notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GameParticipationStatus = typeof gameParticipationStatus.$inferSelect;
export type InsertGameParticipationStatus = typeof gameParticipationStatus.$inferInsert;

/**
 * Feed media uploads - direct upload without approval
 */
export const feedMediaUploads = pgTable("feed_media_uploads", {
  id: serial("id").primaryKey(),
  feedPostId: integer("feedPostId")
    .notNull()
    .references(() => feedPosts.id, { onDelete: "cascade" }),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: pgEnum("mediaType_feed_upload", ["image", "video"])("mediaType").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedMediaUpload = typeof feedMediaUploads.$inferSelect;
export type InsertFeedMediaUpload = typeof feedMediaUploads.$inferInsert;

/**
 * Profile photos - user profile images without approval
 */
export const profilePhotos = pgTable("profile_photos", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  photoUrl: text("photoUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfilePhoto = typeof profilePhotos.$inferSelect;
export type InsertProfilePhoto = typeof profilePhotos.$inferInsert;

/**
 * Gallery media uploads - requires admin approval
 */
export const galleryMediaUploads = pgTable("gallery_media_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: pgEnum("mediaType_gallery", ["image", "video"])("mediaType").notNull(),
  description: text("description"),
  status: pgEnum("status_gallery", ["pending", "approved", "rejected"])("status").default("pending").notNull(),
  approvedBy: integer("approvedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryMediaUpload = typeof galleryMediaUploads.$inferSelect;
export type InsertGalleryMediaUpload = typeof galleryMediaUploads.$inferInsert;

/**
 * Game images - direct upload without approval
 */
export const gameImages = pgTable("game_images", {
  id: serial("id").primaryKey(),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  imageUrl: text("imageUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameImage = typeof gameImages.$inferSelect;
export type InsertGameImage = typeof gameImages.$inferInsert;

/**
 * Game team assignments - tracks which team each user is on (BDU or PMC)
 */
export const gameTeamAssignments = pgTable("game_team_assignments", {
  id: serial("id").primaryKey(),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  team: pgEnum("team", ["BDU", "PMC"])("team").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameTeamAssignment = typeof gameTeamAssignments.$inferSelect;
export type InsertGameTeamAssignment = typeof gameTeamAssignments.$inferInsert;

/**
 * Game bans - users banned from specific games (2 failed payment attempts)
 */
export const gameBans = pgTable("game_bans", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  strikes: integer("strikes").default(0).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameBan = typeof gameBans.$inferSelect;
export type InsertGameBan = typeof gameBans.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  memberProfile: one(memberProfiles, {
    fields: [users.id],
    references: [memberProfiles.userId],
  }),
  loadoutPhotos: many(loadoutPhotos),
  gamesCreated: many(games, { relationName: "gamesCreated" }),
  gameParticipations: many(gameParticipations),
  feedPosts: many(feedPosts),
  memberMedia: many(memberMedia),
  storeItems: many(storeItems, { relationName: "storeItems" }),
  boughtItems: many(storeItems, { relationName: "boughtItems" }),
  sentMessages: many(chatMessages, { relationName: "sentMessages" }),
  receivedMessages: many(chatMessages, { relationName: "receivedMessages" }),
  gameBans: many(gameBans),
}));

export const memberProfilesRelations = relations(memberProfiles, ({ one }) => ({
  user: one(users, {
    fields: [memberProfiles.userId],
    references: [users.id],
  }),
}));

export const loadoutPhotosRelations = relations(loadoutPhotos, ({ one }) => ({
  user: one(users, {
    fields: [loadoutPhotos.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  creator: one(users, {
    fields: [games.createdBy],
    references: [users.id],
    relationName: "gamesCreated",
  }),
  participations: many(gameParticipations),
  images: many(gameImages),
  teamAssignments: many(gameTeamAssignments),
  bans: many(gameBans),
  pixInfo: one(gamePixInfo, {
    fields: [games.id],
    references: [gamePixInfo.gameId],
  }),
}));

export const gameParticipationsRelations = relations(
  gameParticipations,
  ({ one }) => ({
    user: one(users, {
      fields: [gameParticipations.userId],
      references: [users.id],
    }),
    game: one(games, {
      fields: [gameParticipations.gameId],
      references: [games.id],
    }),
    status: one(gameParticipationStatus, {
      fields: [gameParticipations.id],
      references: [gameParticipationStatus.participationId],
    }),
  }),
);

export const feedPostsRelations = relations(feedPosts, ({ one, many }) => ({
  creator: one(users, {
    fields: [feedPosts.createdBy],
    references: [users.id],
  }),
  media: many(feedMediaUploads),
}));

export const storeItemsRelations = relations(storeItems, ({ one, many }) => ({
  seller: one(users, {
    fields: [storeItems.sellerId],
    references: [users.id],
    relationName: "storeItems",
  }),
  buyer: one(users, {
    fields: [storeItems.buyerId],
    references: [users.id],
    relationName: "boughtItems",
  }),
  chatMessages: many(chatMessages),
}));
