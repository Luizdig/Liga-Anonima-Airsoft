import { eq, and, desc, isNull, not, gte, lt, ne, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, memberProfiles, games, feedPosts, memberMedia, storeItems, chatMessages, appSettings, honoredMembers, loadoutPhotos, gameParticipations, gamePixInfo, gamePaymentProofs, gameParticipationStatus, gameImages, gameTeamAssignments, gameBans, type MemberProfile, type InsertMemberProfile, type Game, type InsertGame, type FeedPost, type InsertFeedPost, type MemberMedia as TMemberMedia, type InsertMemberMedia, type StoreItem, type InsertStoreItem, type ChatMessage, type InsertChatMessage, type AppSetting, type InsertAppSetting, type HonoredMember, type InsertHonoredMember, type LoadoutPhoto, type InsertLoadoutPhoto, type GameParticipation, type InsertGameParticipation, type GamePixInfo, type InsertGamePixInfo, type GamePaymentProof, type InsertGamePaymentProof, type GameParticipationStatus, type InsertGameParticipationStatus, type GameBan, type InsertGameBan } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;

    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }

    if (user.lastSignedIn) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (user.banned !== undefined) { values.banned = user.banned; updateSet.banned = user.banned; }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ MEMBER PROFILES ============

export async function createMemberProfile(data: InsertMemberProfile) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(memberProfiles).values(data).$returningId();
  return row;
}

export async function getMemberProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(memberProfiles).where(eq(memberProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateMemberProfile(userId: number, data: Partial<InsertMemberProfile>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const profile = await getMemberProfileByUserId(userId);
  if (!profile) {
    return await createMemberProfile({ ...data, userId } as InsertMemberProfile);
  }
  await db.update(memberProfiles).set(data).where(eq(memberProfiles.id, profile.id));
  return getMemberProfileByUserId(userId);
}

// ============ GAMES ============

export async function createGame(data: InsertGame) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(games).values(data).$returningId();
  return row;
}

export async function getUpcomingGames() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).where(eq(games.status, "upcoming")).orderBy(desc(games.gameDate));
}

export async function getAllGames() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).orderBy(desc(games.gameDate));
}

export async function getGameById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateGame(id: number, data: Partial<InsertGame>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(games).set(data).where(eq(games.id, id));
  return getGameById(id);
}

export async function deleteGame(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(games).where(eq(games.id, id));
}

// ============ FEED POSTS ============

export async function createFeedPost(data: InsertFeedPost) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(feedPosts).values(data).$returningId();
  return row;
}

export async function getFeedPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedPosts).orderBy(desc(feedPosts.createdAt));
}

export async function getRecentFeedPosts() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(feedPosts).orderBy(desc(feedPosts.createdAt)).limit(50);
  return result;
}

export async function deleteFeedPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(feedPosts).where(eq(feedPosts.id, id));
}

// ============ MEMBER MEDIA ============

export async function createMemberMedia(data: InsertMemberMedia) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(memberMedia).values(data).$returningId();
  return row;
}

export async function createMemberMediaUpload(data: InsertMemberMedia) {
  return createMemberMedia(data);
}

export function approveMedia(id: number, approvedBy: number) {
  return approveMemberMedia(id, approvedBy);
}

export function rejectMedia(id: number) {
  return rejectMemberMedia(id, 0);
}

export function deleteMedia(id: number) {
  return deleteMemberMedia(id);
}

export async function getPendingMedia() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memberMedia).where(eq(memberMedia.status, "pending")).orderBy(desc(memberMedia.createdAt));
}

export async function getApprovedMedia() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memberMedia).where(eq(memberMedia.status, "approved")).orderBy(desc(memberMedia.approvedAt));
}

export async function approveMemberMedia(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(memberMedia).set({ status: "approved", approvedBy, approvedAt: new Date() }).where(eq(memberMedia.id, id));
  const result = await db.select().from(memberMedia).where(eq(memberMedia.id, id)).limit(1);
  return result[0] || null;
}

export async function rejectMemberMedia(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(memberMedia).set({ status: "rejected", approvedBy, approvedAt: new Date() }).where(eq(memberMedia.id, id));
}

export async function deleteMemberMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(memberMedia).where(eq(memberMedia.id, id));
}

// ============ STORE ITEMS ============

export { storeItems };

export async function createStoreItem(data: InsertStoreItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(storeItems).values(data).$returningId();
  return row;
}

export async function getActiveStoreItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storeItems).where(eq(storeItems.status, "active")).orderBy(desc(storeItems.createdAt));
}

export async function getStoreItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storeItems).orderBy(desc(storeItems.createdAt));
}

export async function getStoreItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(storeItems).where(eq(storeItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateStoreItem(id: number, data: Partial<InsertStoreItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(storeItems).set(data).where(eq(storeItems.id, id));
  return getStoreItemById(id);
}

export async function deleteStoreItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(storeItems).where(eq(storeItems.id, id));
}

// ============ CHAT MESSAGES ============

export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(chatMessages).values(data).$returningId();
  return row;
}

export async function getChatMessagesForItem(storeItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.storeItemId, storeItemId)).orderBy(desc(chatMessages.createdAt));
}

export async function markChatAsRead(senderId: number, receiverId: number, storeItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(chatMessages).set({ read: true }).where(
    and(
      eq(chatMessages.storeItemId, storeItemId),
      eq(chatMessages.senderId, senderId),
      eq(chatMessages.read, false)
    )
  );
}

// Simplified markRead for chat: mark all unread messages in a store item thread as read
export async function markChatAsReadSimple(userId: number, storeItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(chatMessages).set({ read: true }).where(
    and(
      eq(chatMessages.storeItemId, storeItemId),
      ne(chatMessages.senderId, userId),
      eq(chatMessages.read, false)
    )
  );
}

// ============ APP SETTINGS ============

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return result.length > 0 ? (result[0].value ?? null) : null;
}

export async function setSetting(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(appSettings).set({ value, description: description ?? null }).where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value, description: description ?? null });
  }
  return value;
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appSettings);
}

// ============ USER MANAGEMENT ============

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.name);
}

export async function banUser(userId: number, banned: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ banned }).where(eq(users.id, userId));
}

// ============ GAME PARTICIPATIONS ============

export async function createGameParticipation(data: InsertGameParticipation) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(gameParticipations).values(data).$returningId();
  return row;
}

export async function getGameParticipations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const participations = await db.select().from(gameParticipations).where(eq(gameParticipations.userId, userId)).orderBy(gameParticipations.createdAt);
  const gameIds = participations.map((p: { gameId: number }) => p.gameId);
  if (gameIds.length === 0) return [];
  // Join with games and filter out orphaned participations (game deleted)
  const result = await db.select({
    id: gameParticipations.id,
    userId: gameParticipations.userId,
    gameId: gameParticipations.gameId,
    gameTitle: games.title,
    gameDate: games.gameDate,
    gameLocation: games.location,
    gameStatus: games.status,
    paymentStatus: gameParticipations.paymentStatus,
    createdAt: gameParticipations.createdAt,
  }).from(gameParticipations)
  .innerJoin(games, eq(gameParticipations.gameId, games.id))
  .where(eq(gameParticipations.userId, userId))
  .orderBy(gameParticipations.createdAt);
  return result;
}

// ============ LOADOUT PHOTOS ============

export async function createLoadoutPhoto(data: InsertLoadoutPhoto) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(loadoutPhotos).values(data).$returningId();
  return row;
}

export async function getLoadoutPhotos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loadoutPhotos).where(eq(loadoutPhotos.userId, userId)).orderBy(loadoutPhotos.orderIndex);
}

export async function deleteLoadoutPhoto(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(loadoutPhotos).where(and(eq(loadoutPhotos.id, id), eq(loadoutPhotos.userId, userId)));
}

export async function getMaxLoadoutPhotos(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(loadoutPhotos).where(eq(loadoutPhotos.userId, userId));
  return result[0]?.count ?? 0;
}

// ============ GAME PIX INFO ============

export async function createGamePixInfo(data: InsertGamePixInfo) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(gamePixInfo).values(data).$returningId();
  return row;
}

export async function getGamePixInfo(gameId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gamePixInfo).where(eq(gamePixInfo.gameId, gameId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateGamePixInfo(gameId: number, data: Partial<InsertGamePixInfo>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(gamePixInfo).set(data).where(eq(gamePixInfo.gameId, gameId));
  return getGamePixInfo(gameId);
}

// ============ GAME PAYMENT PROOFS ============

export async function createGamePaymentProof(data: InsertGamePaymentProof) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(gamePaymentProofs).values(data).$returningId();
  return row;
}

export async function getGamePaymentProofs(gameId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gamePaymentProofs).where(eq(gamePaymentProofs.gameId, gameId)).orderBy(desc(gamePaymentProofs.createdAt));
}

export async function getGamePaymentProofsByUser(gameId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gamePaymentProofs).where(and(eq(gamePaymentProofs.gameId, gameId), eq(gamePaymentProofs.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function approveGamePaymentProof(proofId: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(gamePaymentProofs).set({ status: "approved", approvedBy, approvedAt: new Date() }).where(eq(gamePaymentProofs.id, proofId));
}

export async function rejectGamePaymentProof(proofId: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(gamePaymentProofs).set({ status: "rejected", approvedBy, approvedAt: new Date() }).where(eq(gamePaymentProofs.id, proofId));
}

// ============ GAME PARTICIPATION STATUS ============

export async function createGameParticipationStatus(data: InsertGameParticipationStatus) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(gameParticipationStatus).values(data).$returningId();
  return row;
}

export async function updateGameParticipationStatus(participationId: number, isPaid: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(gameParticipationStatus).set({ isPaid, paidAt: isPaid ? new Date() : null }).where(eq(gameParticipationStatus.participationId, participationId));
}

export async function getGameParticipationStatus(participationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gameParticipationStatus).where(eq(gameParticipationStatus.participationId, participationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getGameParticipantsWithStatus(gameId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    participationId: gameParticipations.id,
    userId: gameParticipations.userId,
    gameId: gameParticipations.gameId,
    userName: users.name,
    userEmail: users.email,
    paymentStatus: gameParticipations.paymentStatus,
    proofUrl: gameParticipations.proofUrl,
    failCount: gameParticipations.failCount,
    createdAt: gameParticipations.createdAt,
  }).from(gameParticipations)
  .leftJoin(users, eq(gameParticipations.userId, users.id))
  .where(eq(gameParticipations.gameId, gameId))
  .orderBy(gameParticipations.createdAt);
}

// ============ HONORED MEMBERS ============

export async function createHonoredMember(data: InsertHonoredMember) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(honoredMembers).values(data).$returningId();
  return row;
}

export async function getHonoredMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(honoredMembers).orderBy(honoredMembers.createdAt);
}

export async function deleteHonoredMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(honoredMembers).where(eq(honoredMembers.id, id));
}

export async function updateHonoredMember(id: number, data: Partial<InsertHonoredMember>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(honoredMembers).set(data).where(eq(honoredMembers.id, id));
  const result = await db.select().from(honoredMembers).where(eq(honoredMembers.id, id)).limit(1);
  return result[0] || null;
}


// ============ GAME BANS ============

export async function isUserBannedFromGame(userId: number, gameId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(gameBans).where(and(eq(gameBans.userId, userId), eq(gameBans.gameId, gameId))).limit(1);
  // Ban efetivo é quando reason está preenchido (strikes >= 2)
  return result.length > 0 && result[0].reason !== null;
}

export async function getUserStrikesForGame(userId: number, gameId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(gameBans).where(and(eq(gameBans.userId, userId), eq(gameBans.gameId, gameId))).limit(1);
  return result.length > 0 ? result[0].strikes : 0;
}

export async function banUserFromGame(userId: number, gameId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Verificar se já existe registro de strikes
  const [existing] = await db.select().from(gameBans)
    .where(and(eq(gameBans.userId, userId), eq(gameBans.gameId, gameId)))
    .limit(1);
  if (existing) {
    // Atualizar com reason para efetivar o ban
    await db.update(gameBans)
      .set({ reason: reason || "Pagamento não aprovado", strikes: existing.strikes + 1 })
      .where(eq(gameBans.id, existing.id));
  } else {
    // Criar novo ban direto (ex: rejeição de comprovante pelo admin)
    await db.insert(gameBans).values({ userId, gameId, strikes: 2, reason: reason || "Pagamento não aprovado" });
  }
}

export async function getGameBans(gameId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gameBans).where(eq(gameBans.gameId, gameId));
}

// ============ PAYMENT STATUS HELPERS ============

export async function updateParticipationPaymentStatus(participationId: number, status: "none" | "pending" | "approved" | "rejected", proofUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateData: Record<string, unknown> = { paymentStatus: status };
  if (proofUrl !== undefined) updateData.proofUrl = proofUrl;
  await db.update(gameParticipations).set(updateData).where(eq(gameParticipations.id, participationId));
}

export async function incrementFailCount(participationId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [current] = await db.select({ failCount: gameParticipations.failCount }).from(gameParticipations).where(eq(gameParticipations.id, participationId));
  const newCount = (current?.failCount || 0) + 1;
  await db.update(gameParticipations).set({ failCount: newCount }).where(eq(gameParticipations.id, participationId));
  return newCount;
}

export async function getExpiredParticipations(gameId: number, deadlineDays: number) {
  const db = await getDb();
  if (!db) return [];
  const deadline = new Date();
  deadline.setDate(deadline.getDate() - deadlineDays);
  return db.select().from(gameParticipations)
    .where(and(
      eq(gameParticipations.gameId, gameId),
      eq(gameParticipations.paymentStatus, "none"),
      lt(gameParticipations.createdAt, deadline)
    ));
}

export async function removeParticipation(participationId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(gameParticipations).where(eq(gameParticipations.id, participationId));
}

// Re-export schema tables needed by routers.ts
export { gameImages, gamePaymentProofs, gameTeamAssignments, gameBans } from "../drizzle/schema";
