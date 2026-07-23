import "dotenv/config";
import { eq, and, desc, isNull, not, gte, lt, ne, count, inArray } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';

type DbClient = NodePgDatabase<typeof schema>;

// Singleton instance of the database client
let _db: DbClient | null = null;

// Function to handle Neon's connection string requirements for connection poolers
function applyNeonWorkaround(connectionString: string): string {
  if (
    connectionString.includes("pooler.aws.neon.tech") &&
    !connectionString.includes("options=--no-prepare")
  ) {
    const separator = connectionString.includes("?") ? "&" : "?";
    return `${connectionString}${separator}options=--no-prepare`;
  }
  return connectionString;
}

/**
 * Lazily initializes and returns a singleton database client instance.
 * Throws an error if the DATABASE_URL is not set or if connection fails.
 */
export function getDb(): DbClient {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Cannot initialize database.");
    }
    try {
      const connectionString = applyNeonWorkaround(process.env.DATABASE_URL);
      const pool = new Pool({ connectionString });
      _db = drizzle(pool, { schema, logger: ENV.nodeEnv === 'development' });
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      throw new Error("Failed to connect to the database.");
    }
  }
  return _db;
}

// ============ USERS ============

export async function upsertUser(user: schema.InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();

  try {
    const valuesToInsert: schema.InsertUser = {
      ...user,
      lastSignedIn: user.lastSignedIn ?? new Date(),
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
    };

    const valuesToUpdate: Partial<Omit<schema.User, 'id' | 'createdAt'>> = {
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      lastSignedIn: user.lastSignedIn ?? new Date(),
      updatedAt: new Date(),
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : undefined),
      banned: user.banned,
    };

    // Remove undefined fields from updateSet so they don't overwrite existing data with null
    Object.keys(valuesToUpdate).forEach(key => (valuesToUpdate as any)[key] === undefined && delete (valuesToUpdate as any)[key]);

    await db.insert(schema.users)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: schema.users.openId,
        set: valuesToUpdate,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<schema.User | undefined> {
  const db = getDb();
  const [result] = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result;
}

// ============ MEMBER PROFILES ============

export async function createMemberProfile(data: schema.InsertMemberProfile) {
  const db = getDb();
  const [row] = await db.insert(schema.memberProfiles).values(data).returning({ id: schema.memberProfiles.id });
  return row;
}

export async function getMemberProfileByUserId(userId: number) {
  const db = getDb();
  const [result] = await db.select().from(schema.memberProfiles).where(eq(schema.memberProfiles.userId, userId)).limit(1);
  return result ?? null;
}

export async function updateMemberProfile(userId: number, data: Partial<schema.InsertMemberProfile>) {
  const db = getDb();
  const profile = await getMemberProfileByUserId(userId);
  if (!profile) {
    return await createMemberProfile({ ...data, userId } as schema.InsertMemberProfile);
  }
  await db.update(schema.memberProfiles).set(data).where(eq(schema.memberProfiles.id, profile.id));
  return getMemberProfileByUserId(userId);
}

// ============ GAMES ============

export async function createGame(data: schema.InsertGame) {
  const db = getDb();
  const [row] = await db.insert(schema.games).values(data).returning({ id: schema.games.id });
  return row;
}

export async function getUpcomingGames() {
  const db = getDb();
  return db.select().from(schema.games).where(eq(schema.games.status, "upcoming")).orderBy(desc(schema.games.gameDate));
}

export async function getAllGames() {
  const db = getDb();
  return db.select().from(schema.games).orderBy(desc(schema.games.gameDate));
}

export async function getGameById(id: number) {
  const db = getDb();
  const [result] = await db.select().from(schema.games).where(eq(schema.games.id, id)).limit(1);
  return result ?? null;
}

export async function updateGame(id: number, data: Partial<schema.InsertGame>) {
  const db = getDb();
  await db.update(schema.games).set(data).where(eq(schema.games.id, id));
  return getGameById(id);
}

export async function deleteGame(id: number) {
  const db = getDb();
  await db.delete(schema.games).where(eq(schema.games.id, id));
}

// ============ FEED POSTS ============

export async function createFeedPost(data: schema.InsertFeedPost) {
  const db = getDb();
  const [row] = await db.insert(schema.feedPosts).values(data).returning({ id: schema.feedPosts.id });
  return row;
}

export async function getFeedPosts() {
  const db = getDb();
  return db.select().from(schema.feedPosts).orderBy(desc(schema.feedPosts.createdAt));
}

export async function getRecentFeedPosts() {
  const db = getDb();
  return db.select().from(schema.feedPosts).orderBy(desc(schema.feedPosts.createdAt)).limit(50);
}

export async function deleteFeedPost(id: number) {
  const db = getDb();
  await db.delete(schema.feedPosts).where(eq(schema.feedPosts.id, id));
}

// ============ MEMBER MEDIA ============

export async function createMemberMedia(data: schema.InsertMemberMedia) {
  const db = getDb();
  const [row] = await db.insert(schema.memberMedia).values(data).returning({ id: schema.memberMedia.id });
  return row;
}

export async function createMemberMediaUpload(data: schema.InsertMemberMedia) {
  return createMemberMedia(data);
}

export function approveMedia(id: number, approvedBy: number) {
  return approveMemberMedia(id, approvedBy);
}

export function rejectMedia(id: number) {
  return rejectMemberMedia(id, 0); // Assuming 0 is a valid user ID for system actions or it's nullable
}

export function deleteMedia(id: number) {
  return deleteMemberMedia(id);
}

export async function getPendingMedia() {
  const db = getDb();
  return db.select().from(schema.memberMedia).where(eq(schema.memberMedia.status, "pending")).orderBy(desc(schema.memberMedia.createdAt));
}

export async function getApprovedMedia() {
  const db = getDb();
  return db.select().from(schema.memberMedia).where(eq(schema.memberMedia.status, "approved")).orderBy(desc(schema.memberMedia.approvedAt));
}

export async function approveMemberMedia(id: number, approvedBy: number) {
  const db = getDb();
  await db.update(schema.memberMedia).set({ status: "approved", approvedBy, approvedAt: new Date() }).where(eq(schema.memberMedia.id, id));
  const [result] = await db.select().from(schema.memberMedia).where(eq(schema.memberMedia.id, id)).limit(1);
  return result ?? null;
}

export async function rejectMemberMedia(id: number, approvedBy: number) {
  const db = getDb();
  await db.update(schema.memberMedia).set({ status: "rejected", approvedBy, approvedAt: new Date() }).where(eq(schema.memberMedia.id, id));
}

export async function deleteMemberMedia(id: number) {
  const db = getDb();
  await db.delete(schema.memberMedia).where(eq(schema.memberMedia.id, id));
}

// ============ STORE ITEMS ============

export async function createStoreItem(data: schema.InsertStoreItem) {
  const db = getDb();
  const [row] = await db.insert(schema.storeItems).values(data).returning({ id: schema.storeItems.id });
  return row;
}

export async function getActiveStoreItems() {
  const db = getDb();
  return db.select().from(schema.storeItems).where(eq(schema.storeItems.status, "active")).orderBy(desc(schema.storeItems.createdAt));
}

export async function getStoreItems() {
  const db = getDb();
  return db.select().from(schema.storeItems).orderBy(desc(schema.storeItems.createdAt));
}

export async function getStoreItemById(id: number) {
  const db = getDb();
  const [result] = await db.select().from(schema.storeItems).where(eq(schema.storeItems.id, id)).limit(1);
  return result ?? null;
}

export async function updateStoreItem(id: number, data: Partial<schema.InsertStoreItem>) {
  const db = getDb();
  await db.update(schema.storeItems).set(data).where(eq(schema.storeItems.id, id));
  return getStoreItemById(id);
}

export async function deleteStoreItem(id: number) {
  const db = getDb();
  await db.delete(schema.storeItems).where(eq(schema.storeItems.id, id));
}

// ============ CHAT MESSAGES ============

export async function createChatMessage(data: schema.InsertChatMessage) {
  const db = getDb();
  const [row] = await db.insert(schema.chatMessages).values(data).returning({ id: schema.chatMessages.id });
  return row;
}

export async function getChatMessagesForItem(storeItemId: number) {
  const db = getDb();
  return db.select().from(schema.chatMessages).where(eq(schema.chatMessages.storeItemId, storeItemId)).orderBy(desc(schema.chatMessages.createdAt));
}

export async function markChatAsRead(senderId: number, receiverId: number, storeItemId: number) {
  const db = getDb();
  await db.update(schema.chatMessages).set({ read: true }).where(
    and(
      eq(schema.chatMessages.storeItemId, storeItemId),
      eq(schema.chatMessages.senderId, senderId),
      eq(schema.chatMessages.read, false)
    )
  );
}

// Simplified markRead for chat: mark all unread messages in a store item thread as read
export async function markChatAsReadSimple(userId: number, storeItemId: number) {
  const db = getDb();
  await db.update(schema.chatMessages).set({ read: true }).where(
    and(
      eq(schema.chatMessages.storeItemId, storeItemId),
      ne(schema.chatMessages.senderId, userId),
      eq(schema.chatMessages.read, false)
    )
  );
}

// ============ APP SETTINGS ============

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const [result] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, key)).limit(1);
  return result?.value ?? null;
}

export async function setSetting(key: string, value: string, description?: string) {
  const db = getDb();
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(schema.appSettings).set({ value, description: description ?? undefined }).where(eq(schema.appSettings.key, key));
  } else {
    await db.insert(schema.appSettings).values({ key, value, description: description ?? undefined });
  }
  return value;
}

export async function getAllSettings() {
  const db = getDb();
  return db.select().from(schema.appSettings);
}

// ============ USER MANAGEMENT ============

// ============ GAME PARTICIPATIONS ============

export async function createGameParticipation(data: schema.InsertGameParticipation) {
  const db = getDb();
  const [row] = await db.insert(schema.gameParticipations).values(data).returning({ id: schema.gameParticipations.id });
  return row;
}

export async function getGameParticipations(userId: number) {
  const db = getDb();
  return db.select({
    id: schema.gameParticipations.id,
    userId: schema.gameParticipations.userId,
    gameId: schema.gameParticipations.gameId,
    gameTitle: schema.games.title,
    gameDate: schema.games.gameDate,
    gameLocation: schema.games.location,
    gameStatus: schema.games.status,
    paymentStatus: schema.gameParticipations.paymentStatus,
    createdAt: schema.gameParticipations.createdAt,
  }).from(schema.gameParticipations)
  .innerJoin(schema.games, eq(schema.gameParticipations.gameId, schema.games.id))
  .where(eq(schema.gameParticipations.userId, userId))
  .orderBy(desc(schema.gameParticipations.createdAt));
}

// ============ LOADOUT PHOTOS ============

export async function createLoadoutPhoto(data: schema.InsertLoadoutPhoto) {
  const db = getDb();
  const [row] = await db.insert(schema.loadoutPhotos).values(data).returning({ id: schema.loadoutPhotos.id });
  return row;
}

export async function getLoadoutPhotos(userId: number) {
  const db = getDb();
  return db.select().from(schema.loadoutPhotos).where(eq(schema.loadoutPhotos.userId, userId)).orderBy(schema.loadoutPhotos.orderIndex);
}

export async function deleteLoadoutPhoto(id: number, userId: number) {
  const db = getDb();
  await db.delete(schema.loadoutPhotos).where(and(eq(schema.loadoutPhotos.id, id), eq(schema.loadoutPhotos.userId, userId)));
}

export async function getMaxLoadoutPhotos(userId: number): Promise<number> {
  const db = getDb();
  const [result] = await db.select({ count: count() }).from(schema.loadoutPhotos).where(eq(schema.loadoutPhotos.userId, userId));
  return result[0]?.count ?? 0;
}

// ============ GAME PIX INFO ============

export async function createGamePixInfo(data: schema.InsertGamePixInfo) {
  const db = getDb();
  const [row] = await db.insert(schema.gamePixInfo).values(data).returning({ id: schema.gamePixInfo.id });
  return row;
}

export async function getGamePixInfo(gameId: number) {
  const db = getDb();
  const [result] = await db.select().from(schema.gamePixInfo).where(eq(schema.gamePixInfo.gameId, gameId)).limit(1);
  return result ?? null;
}

export async function updateGamePixInfo(gameId: number, data: Partial<schema.InsertGamePixInfo>) {
  const db = getDb();
  await db.update(schema.gamePixInfo).set(data).where(eq(schema.gamePixInfo.gameId, gameId));
  return getGamePixInfo(gameId);
}

// ============ GAME PAYMENT PROOFS ============

export async function createGamePaymentProof(data: schema.InsertGamePaymentProof) {
  const db = getDb();
  const [row] = await db.insert(schema.gamePaymentProofs).values(data).returning({ id: schema.gamePaymentProofs.id });
  return row;
}

export async function getGamePaymentProofs(gameId: number) {
  const db = getDb();
  return db.select().from(schema.gamePaymentProofs).where(eq(schema.gamePaymentProofs.gameId, gameId)).orderBy(desc(schema.gamePaymentProofs.createdAt));
}

export async function getGamePaymentProofsByUser(gameId: number, userId: number) {
  const db = getDb();
  const [result] = await db.select().from(schema.gamePaymentProofs).where(and(eq(schema.gamePaymentProofs.gameId, gameId), eq(schema.gamePaymentProofs.userId, userId))).limit(1);
  return result ?? null;
}

export async function approveGamePaymentProof(proofId: number, approvedBy: number) {
  const db = getDb();
  await db.update(schema.gamePaymentProofs).set({ status: "approved", approvedBy, approvedAt: new Date() }).where(eq(schema.gamePaymentProofs.id, proofId));
}

export async function rejectGamePaymentProof(proofId: number, approvedBy: number) {
  const db = getDb();
  await db.update(schema.gamePaymentProofs).set({ status: "rejected", approvedBy, approvedAt: new Date() }).where(eq(schema.gamePaymentProofs.id, proofId));
}

// ============ GAME PARTICIPATION STATUS ============

export async function createGameParticipationStatus(data: schema.InsertGameParticipationStatus) {
  const db = getDb();
  const [row] = await db.insert(schema.gameParticipationStatus).values(data).returning({ id: schema.gameParticipationStatus.id });
  return row;
}

export async function updateGameParticipationStatus(participationId: number, isPaid: boolean) {
  const db = getDb();
  await db.update(schema.gameParticipationStatus).set({ isPaid, paidAt: isPaid ? new Date() : null }).where(eq(schema.gameParticipationStatus.participationId, participationId));
}

export async function getGameParticipationStatus(participationId: number) {
  const db = getDb();
  const [result] = await db.select().from(schema.gameParticipationStatus).where(eq(schema.gameParticipationStatus.participationId, participationId)).limit(1);
  return result ?? null;
}

export async function getGameParticipantsWithStatus(gameId: number) {
  const db = getDb();
  return db.select({
    participationId: schema.gameParticipations.id,
    userId: schema.gameParticipations.userId,
    gameId: schema.gameParticipations.gameId,
    userName: schema.users.name,
    userEmail: schema.users.email,
    paymentStatus: schema.gameParticipations.paymentStatus,
    proofUrl: schema.gameParticipations.proofUrl,
    failCount: schema.gameParticipations.failCount,
    createdAt: schema.gameParticipations.createdAt,
  }).from(schema.gameParticipations)
  .leftJoin(schema.users, eq(schema.gameParticipations.userId, schema.users.id))
  .where(eq(schema.gameParticipations.gameId, gameId))
  .orderBy(desc(schema.gameParticipations.createdAt));
}

// ============ HONORED MEMBERS ============

export async function createHonoredMember(data: schema.InsertHonoredMember) {
  const db = getDb();
  const [row] = await db.insert(schema.honoredMembers).values(data).returning({ id: schema.honoredMembers.id });
  return row;
}

export async function getHonoredMembers() {
  const db = getDb();
  return db.select().from(schema.honoredMembers).orderBy(desc(schema.honoredMembers.createdAt));
}

export async function deleteHonoredMember(id: number) {
  const db = getDb();
  await db.delete(schema.honoredMembers).where(eq(schema.honoredMembers.id, id));
}

export async function updateHonoredMember(id: number, data: Partial<schema.InsertHonoredMember>) {
  const db = getDb();
  await db.update(schema.honoredMembers).set(data).where(eq(schema.honoredMembers.id, id));
  const [result] = await db.select().from(schema.honoredMembers).where(eq(schema.honoredMembers.id, id)).limit(1);
  return result ?? null;
}


// ============ GAME BANS ============

export async function isUserBannedFromGame(userId: number, gameId: number): Promise<boolean> {
  const db = getDb();
  const [result] = await db.select().from(schema.gameBans).where(and(eq(schema.gameBans.userId, userId), eq(schema.gameBans.gameId, gameId))).limit(1);
  // Ban is effective when reason is filled (strikes >= 2)
  return !!result?.reason;
}

export async function getUserStrikesForGame(userId: number, gameId: number): Promise<number> {
  const db = getDb();
  const [result] = await db.select().from(schema.gameBans).where(and(eq(schema.gameBans.userId, userId), eq(schema.gameBans.gameId, gameId))).limit(1);
  return result?.strikes ?? 0;
}

export async function banUserFromGame(userId: number, gameId: number, reason?: string) {
  const db = getDb();
  const [existing] = await db.select().from(schema.gameBans)
    .where(and(eq(schema.gameBans.userId, userId), eq(schema.gameBans.gameId, gameId)))
    .limit(1);

  if (existing) {
    // Update with reason to make the ban effective
    await db.update(schema.gameBans)
      .set({ reason: reason || "Pagamento não aprovado", strikes: existing.strikes + 1 })
      .where(eq(schema.gameBans.id, existing.id));
  } else {
    // Create a new ban directly (e.g., admin rejecting payment proof)
    await db.insert(schema.gameBans).values({ userId, gameId, strikes: 2, reason: reason || "Pagamento não aprovado" });
  }
}

export async function getGameBans(gameId: number) {
  const db = getDb();
  return db.select().from(schema.gameBans).where(eq(schema.gameBans.gameId, gameId));
}

// ============ PAYMENT STATUS HELPERS ============

export async function updateParticipationPaymentStatus(participationId: number, status: "none" | "pending" | "approved" | "rejected", proofUrl?: string) {
  const db = getDb();
  const updateData: Partial<schema.InsertGameParticipation> = { paymentStatus: status };
  if (proofUrl !== undefined) updateData.proofUrl = proofUrl;
  await db.update(schema.gameParticipations).set(updateData).where(eq(schema.gameParticipations.id, participationId));
}

export async function incrementFailCount(participationId: number): Promise<number> {
  const db = getDb();
  const [current] = await db.select({ failCount: schema.gameParticipations.failCount }).from(schema.gameParticipations).where(eq(schema.gameParticipations.id, participationId));
  const newCount = (current?.failCount || 0) + 1;
  await db.update(schema.gameParticipations).set({ failCount: newCount }).where(eq(schema.gameParticipations.id, participationId));
  return newCount;
}

export async function getExpiredParticipations(gameId: number, deadlineDays: number) {
  const db = getDb();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() - deadlineDays);
  return db.select().from(schema.gameParticipations)
    .where(and(
      eq(schema.gameParticipations.gameId, gameId),
      eq(schema.gameParticipations.paymentStatus, "none"),
      lt(schema.gameParticipations.createdAt, deadline)
    ));
}

export async function removeParticipation(participationId: number) {
  const db = getDb();
  await db.delete(schema.gameParticipations).where(eq(schema.gameParticipations.id, participationId));
}
