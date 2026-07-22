import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
// gameImages, gamePaymentProofs, gameTeamAssignments are now imported from ./db (re-exported from schema)
import {
  getDb,
  getAllUsers,
  banUser,
  createMemberProfile,
  getMemberProfileByUserId,
  updateMemberProfile,
  getRecentFeedPosts,
  createFeedPost,
  deleteFeedPost,
  getUpcomingGames,
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  getPendingMedia,
  getApprovedMedia,
  approveMedia,
  rejectMedia,
  deleteMedia,
  createMemberMediaUpload,
  getStoreItems,
  getStoreItemById,
  createStoreItem,
  updateStoreItem,
  deleteStoreItem,
  getChatMessagesForItem,
  createChatMessage,
  markChatAsReadSimple,
  getAllSettings,
  setSetting,
  getSetting,
  createHonoredMember,
  getHonoredMembers,
  deleteHonoredMember,
  updateHonoredMember,
  createLoadoutPhoto,
  getLoadoutPhotos,
  deleteLoadoutPhoto,
  getMaxLoadoutPhotos,
  createGameParticipation,
  getGameParticipations,
  createGamePixInfo,
  getGamePixInfo,
  updateGamePixInfo,
  createGamePaymentProof,
  getGamePaymentProofs,
  getGamePaymentProofsByUser,
  approveGamePaymentProof,
  rejectGamePaymentProof,
  createGameParticipationStatus,
  updateGameParticipationStatus,
  getGameParticipantsWithStatus,
  isUserBannedFromGame,
  banUserFromGame,
  updateParticipationPaymentStatus,
  incrementFailCount,
  removeParticipation,
  gameImages,
  gamePaymentProofs,
  gameTeamAssignments,
  gameBans,
} from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { gameParticipations, galleryMediaUploads, feedMediaUploads, profilePhotos } from "../drizzle/schema";
import { users, storeItems, memberProfiles, games as gamesTable } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { Buffer } from "buffer";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

async function getUserNames(userIds: number[]): Promise<Map<number, string>> {
  const db = await getDb();
  if (!db || userIds.length === 0) return new Map();
  const allUsers = await db.select({ id: users.id, name: users.name }).from(users);
  const map = new Map<number, string>();
  for (const u of allUsers) map.set(u.id, u.name || "Membro");
  return map;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  games: router({
    upcoming: publicProcedure.query(async () => {
      return await getUpcomingGames();
    }),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getGameById(input.id);
      }),
    all: adminProcedure.query(async () => {
      return await getAllGames();
    }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(3).max(200),
        description: z.string().max(5000).optional(),
        location: z.string().min(3).max(300),
        gameDate: z.string(),
        value: z.string().optional(),
        maxPlayers: z.number().min(1).max(500).optional(),
        imageUrl: z.string().optional(),
        pixKey: z.string().optional(),
        teamsEnabled: z.boolean().optional(),
        paymentDeadlineDays: z.number().min(1).max(30).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const date = new Date(input.gameDate);
        if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Data inválida. Use uma data futura válida (ex: 2026-07-12)." });
        }
        const game = await createGame({
          title: input.title,
          description: input.description || null,
          location: input.location,
          gameDate: date,
          value: input.value || null,
          maxPlayers: input.maxPlayers ?? 30,
          createdBy: ctx.user!.id,
          imageUrl: input.imageUrl || null,
          teamsEnabled: input.teamsEnabled ?? false,
          paymentDeadlineDays: input.paymentDeadlineDays ?? 3,
        });
        
        if (input.pixKey && game.id) {
          await createGamePixInfo({
            gameId: game.id,
            pixKey: input.pixKey,
          });
        }
        
        return game;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(3).max(200),
        description: z.string().max(5000).optional(),
        location: z.string().min(3).max(300),
        gameDate: z.string(),
        value: z.string().optional(),
        maxPlayers: z.number().min(1).max(500).optional(),
        imageUrl: z.string().optional(),
        pixKey: z.string().optional(),
        teamsEnabled: z.boolean().optional(),
        paymentDeadlineDays: z.number().min(1).max(30).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const date = new Date(input.gameDate);
        if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Data inválida. Use uma data futura válida (ex: 2026-07-12)." });
        }
        const game = await updateGame(input.id, {
          title: input.title,
          description: input.description || null,
          location: input.location,
          gameDate: date,
          value: input.value || null,
          maxPlayers: input.maxPlayers ?? 30,
          imageUrl: input.imageUrl || null,
          teamsEnabled: input.teamsEnabled ?? false,
          paymentDeadlineDays: input.paymentDeadlineDays ?? 3,
        });
        
        if (input.pixKey) {
          const existing = await getGamePixInfo(input.id);
          if (existing) {
            await updateGamePixInfo(input.id, { pixKey: input.pixKey });
          } else {
            await createGamePixInfo({
              gameId: input.id,
              pixKey: input.pixKey,
            });
          }
        }
        
        return game;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Limpar participações relacionadas ao jogo
        const db = await getDb();
        if (db) {
          await db.delete(gameParticipations).where(eq(gameParticipations.gameId, input.id));
        }
        await deleteGame(input.id);
        return { success: true };
      }),
    setPixKey: adminProcedure
      .input(z.object({
        gameId: z.number(),
        pixKey: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const existing = await getGamePixInfo(input.gameId);
        if (existing) {
          return await updateGamePixInfo(input.gameId, { pixKey: input.pixKey });
        }
        return await createGamePixInfo({
          gameId: input.gameId,
          pixKey: input.pixKey,
        });
      }),
    getPixKey: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        return await getGamePixInfo(input.gameId);
      }),
    getPaymentProofs: adminProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        // JOIN com gameParticipations para pegar participationId
        const proofs = await db.select({
          id: gamePaymentProofs.id,
          gameId: gamePaymentProofs.gameId,
          userId: gamePaymentProofs.userId,
          proofUrl: gamePaymentProofs.proofUrl,
          status: gamePaymentProofs.status,
          createdAt: gamePaymentProofs.createdAt,
          participationId: gameParticipations.id,
        })
        .from(gamePaymentProofs)
        .innerJoin(gameParticipations, and(
          eq(gamePaymentProofs.userId, gameParticipations.userId),
          eq(gamePaymentProofs.gameId, gameParticipations.gameId)
        ))
        .where(eq(gamePaymentProofs.gameId, input.gameId))
        .orderBy(desc(gamePaymentProofs.createdAt));
        
        const userNames = await getUserNames(proofs.map(p => p.userId));
        return proofs.map(p => ({
          ...p,
          userName: userNames.get(p.userId) || "Membro",
        }));
      }),
    submitPaymentProof: protectedProcedure
      .input(z.object({
        gameId: z.number(),
        proofUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        
        // Encontrar a participação do usuário neste jogo
        const [participation] = await db.select().from(gameParticipations)
          .where(and(eq(gameParticipations.userId, ctx.user!.id), eq(gameParticipations.gameId, input.gameId)))
          .limit(1);
        
        if (!participation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Você não está inscrito neste jogo" });
        }
        
        if (participation.paymentStatus === "pending") {
          throw new TRPCError({ code: "CONFLICT", message: "Você já enviou um comprovante pendente" });
        }
        if (participation.paymentStatus === "approved") {
          throw new TRPCError({ code: "CONFLICT", message: "Seu pagamento já foi aprovado" });
        }
        
        // Atualizar status para pending e salvar URL do comprovante
        await updateParticipationPaymentStatus(participation.id, "pending", input.proofUrl);
        
        // Também salvar na tabela de proofs para histórico
        await createGamePaymentProof({
          gameId: input.gameId,
          userId: ctx.user!.id,
          proofUrl: input.proofUrl,
        });
        
        return { success: true };
      }),
    approvePaymentProof: adminProcedure
      .input(z.object({ participationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        
        // Buscar a participação para pegar userId e gameId
        const [participation] = await db.select().from(gameParticipations)
          .where(eq(gameParticipations.id, input.participationId)).limit(1);
        
        if (!participation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Participação não encontrada" });
        }
        
        // Atualizar status na participação
        await updateParticipationPaymentStatus(input.participationId, "approved");
        
        // Atualizar também na tabela gamePaymentProofs
        await db.update(gamePaymentProofs)
          .set({ status: "approved", approvedBy: ctx.user!.id, approvedAt: new Date() })
          .where(and(eq(gamePaymentProofs.gameId, participation.gameId), eq(gamePaymentProofs.userId, participation.userId)))
          .limit(1);
        
        return { success: true };
      }),
    rejectPaymentProof: adminProcedure
      .input(z.object({ participationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        
        // Buscar a participação para pegar userId e gameId
        const [participation] = await db.select().from(gameParticipations)
          .where(eq(gameParticipations.id, input.participationId)).limit(1);
        
        if (!participation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Participação não encontrada" });
        }
        
        // Atualizar status para rejected
        await updateParticipationPaymentStatus(input.participationId, "rejected");
        
        // Atualizar também na tabela gamePaymentProofs
        await db.update(gamePaymentProofs)
          .set({ status: "rejected", approvedBy: ctx.user!.id, approvedAt: new Date() })
          .where(and(eq(gamePaymentProofs.gameId, participation.gameId), eq(gamePaymentProofs.userId, participation.userId)))
          .limit(1);
        
        // Banir o usuário deste jogo
        await banUserFromGame(participation.userId, participation.gameId, "Comprovante rejeitado pelo administrador");
        
        // Remover da lista de inscritos e decrementar contador
        await removeParticipation(input.participationId);
        const game = await getGameById(participation.gameId);
        if (game && (game.currentPlayers ?? 0) > 0) {
          await updateGame(participation.gameId, {
            currentPlayers: (game.currentPlayers ?? 0) - 1,
          });
        }
        
        return { success: true };
      }),
    deletePaymentProof: adminProcedure
      .input(z.object({ proofId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        
        // Deletar o comprovante
        await db.delete(gamePaymentProofs).where(eq(gamePaymentProofs.id, input.proofId));
        
        return { success: true };
      }),
    getParticipants: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        return await getGameParticipantsWithStatus(input.gameId);
      }),
    isUserBanned: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await isUserBannedFromGame(ctx.user!.id, input.gameId);
      }),
    joinGame: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        
        // Verificar se está banido
        const banned = await isUserBannedFromGame(ctx.user!.id, input.gameId);
        if (banned) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você foi banido deste jogo por não cumprir o prazo de pagamento." });
        }
        
        // Verificar se já está inscrito
        const existing = await db.select().from(gameParticipations)
          .where(and(eq(gameParticipations.userId, ctx.user!.id), eq(gameParticipations.gameId, input.gameId)))
          .limit(1);
        
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Você já está inscrito neste jogo" });
        }
        
        const participation = await createGameParticipation({
          userId: ctx.user!.id,
          gameId: input.gameId,
        });
        await createGameParticipationStatus({
          participationId: participation.id,
        });
        
        // Incrementar currentPlayers
        const game = await getGameById(input.gameId);
        if (game) {
          await updateGame(input.gameId, {
            currentPlayers: (game.currentPlayers || 0) + 1,
          });
        }
        
        return participation;
      }),
    leaveGame: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(gameParticipations).where(and(eq(gameParticipations.userId, ctx.user!.id), eq(gameParticipations.gameId, input.gameId)));
        
        // Decrementar currentPlayers
        const game = await getGameById(input.gameId);
        if (game && (game.currentPlayers ?? 0) > 0) {
          await updateGame(input.gameId, {
            currentPlayers: (game.currentPlayers ?? 0) - 1,
          });
        }
        
        return { success: true };
      }),
    isUserJoined: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return false;
        const result = await db.select().from(gameParticipations).where(and(eq(gameParticipations.userId, ctx.user!.id), eq(gameParticipations.gameId, input.gameId))).limit(1);
        return result.length > 0;
      }),
    uploadImage: adminProcedure
      .input(z.object({
        gameId: z.number(),
        imageUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        return await db.insert(gameImages).values({
          gameId: input.gameId,
          imageUrl: input.imageUrl,
        });
      }),
    getImages: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(gameImages).where(eq(gameImages.gameId, input.gameId));
      }),
    joinWithTeam: protectedProcedure
      .input(z.object({
        gameId: z.number(),
        team: z.enum(["BDU", "PMC"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        
        // Verificar se está banido
        const banned = await isUserBannedFromGame(ctx.user!.id, input.gameId);
        if (banned) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você foi banido deste jogo por não cumprir o prazo de pagamento." });
        }
        
        const existing = await db.select().from(gameParticipations)
          .where(and(eq(gameParticipations.userId, ctx.user!.id), eq(gameParticipations.gameId, input.gameId)))
          .limit(1);
        
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Você já está inscrito neste jogo" });
        }
        
        const game = await getGameById(input.gameId);
        if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Jogo não encontrado" });
        
        const maxPerTeam = Math.floor((game.maxPlayers || 30) / 2);
        const teamCount = await db.select().from(gameTeamAssignments)
          .where(and(eq(gameTeamAssignments.gameId, input.gameId), eq(gameTeamAssignments.team, input.team)));
        
        if (teamCount.length >= maxPerTeam) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Time ${input.team} está cheio` });
        }
        
        const participation = await createGameParticipation({
          userId: ctx.user!.id,
          gameId: input.gameId,
        });
        
        await db.insert(gameTeamAssignments).values({
          gameId: input.gameId,
          userId: ctx.user!.id,
          team: input.team,
        });
        
        await createGameParticipationStatus({
          participationId: participation.id,
        });
        
        await updateGame(input.gameId, {
          currentPlayers: (game.currentPlayers || 0) + 1,
        });
        
        return participation;
      }),
    getTeamAssignments: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { BDU: [], PMC: [] };
        
        // Buscar assignments com participacoes aprovadas
        const assignments = await db.select({
          id: gameTeamAssignments.id,
          userId: gameTeamAssignments.userId,
          team: gameTeamAssignments.team,
          paymentStatus: gameParticipations.paymentStatus,
        })
        .from(gameTeamAssignments)
        .innerJoin(gameParticipations, and(
          eq(gameTeamAssignments.userId, gameParticipations.userId),
          eq(gameTeamAssignments.gameId, gameParticipations.gameId)
        ))
        .where(and(
          eq(gameTeamAssignments.gameId, input.gameId),
          eq(gameParticipations.paymentStatus, "approved")
        ));
        
        // Buscar nomes dos usuarios
        const userIds = assignments.map(a => a.userId);
        const userNames = await getUserNames(userIds);
        
        const enriched = assignments.map(a => ({
          ...a,
          userName: userNames.get(a.userId) || "Membro",
        }));
        
        return {
          BDU: enriched.filter(a => a.team === "BDU"),
          PMC: enriched.filter(a => a.team === "PMC"),
        };
      }),
  }),

  feed: router({
    get: publicProcedure.query(async () => {
      const posts = await getRecentFeedPosts();
      const userNames = await getUserNames(posts.map(p => p.createdBy));
      return posts.map(p => ({
        ...p,
        authorName: userNames.get(p.createdBy) || "L.A.A.",
        mediaUrls: (p.mediaUrls as string[] | null) || [],
      }));
    }),
    create: adminProcedure
      .input(z.object({
        title: z.string().max(200).optional(),
        content: z.string().min(1).max(5000),
        mediaUrls: z.array(z.string()).optional(),
        mediaType: z.enum(["none", "image", "video", "mixed"]).default("none"),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createFeedPost({
          title: input.title || null,
          content: input.content,
          mediaUrls: input.mediaUrls || null,
          mediaType: input.mediaType,
          createdBy: ctx.user!.id,
        });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFeedPost(input.id);
        return { success: true };
      }),
  }),

  media: router({
    pending: adminProcedure.query(async () => {
      const items = await getPendingMedia();
      const userNames = await getUserNames(items.map(i => i.userId));
      return items.map(i => ({ ...i, authorName: userNames.get(i.userId) || "Membro" }));
    }),
    approved: publicProcedure.query(async () => {
      return await getApprovedMedia();
    }),
    uploadDirect: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileContent, "base64");
        const extension = input.fileName.split(".").pop() || "png";
        const key = `direct/${ctx.user!.id}/${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { mediaUrl: url };
      }),
    uploadFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        contentType: z.string(),
        mediaType: z.enum(["image", "video"]),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileContent, "base64");
        const extension = input.fileName.split(".").pop() || "png";
        const key = `media/${ctx.user!.id}/${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return await createMemberMediaUpload({
          userId: ctx.user!.id,
          mediaUrl: url,
          mediaType: input.mediaType,
          description: input.description || null,
        });
      }),
    upload: protectedProcedure
      .input(z.object({
        mediaUrl: z.string().url(),
        mediaType: z.enum(["image", "video"]),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createMemberMediaUpload({
          userId: ctx.user!.id,
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
          description: input.description || null,
        });
      }),
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await approveMedia(input.id, ctx.user!.id);
        return { success: true };
      }),
    reject: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await rejectMedia(input.id);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMedia(input.id);
        return { success: true };
      }),
    
    // Gallery uploads - requires approval
    uploadGallery: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        contentType: z.string(),
        mediaType: z.enum(["image", "video"]),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const buffer = Buffer.from(input.fileContent, "base64");
        const extension = input.fileName.split(".").pop() || "png";
        const key = `gallery/${ctx.user!.id}/${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        
        const result = await db.insert(galleryMediaUploads).values({
          userId: ctx.user!.id,
          mediaUrl: url,
          mediaType: input.mediaType,
          description: input.description || null,
        });
        
        return { success: true, id: result[0]?.insertId };
      }),
    
    deleteGallery: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const media = await db.select().from(galleryMediaUploads).where(eq(galleryMediaUploads.id, input.id)).limit(1);
        if (!media[0] || media[0].userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.delete(galleryMediaUploads).where(eq(galleryMediaUploads.id, input.id));
        return { success: true };
      }),
    
    // Feed uploads - no approval needed
    uploadFeed: protectedProcedure
      .input(z.object({
        feedPostId: z.number(),
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        contentType: z.string(),
        mediaType: z.enum(["image", "video"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const buffer = Buffer.from(input.fileContent, "base64");
        const extension = input.fileName.split(".").pop() || "png";
        const key = `feed/${input.feedPostId}/${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        
        const result = await db.insert(feedMediaUploads).values({
          feedPostId: input.feedPostId,
          mediaUrl: url,
          mediaType: input.mediaType,
        });
        
        return { success: true, id: result[0]?.insertId };
      }),
    
    deleteFeedMedia: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const media = await db.select().from(feedMediaUploads).where(eq(feedMediaUploads.id, input.id)).limit(1);
        if (!media[0]) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        await db.delete(feedMediaUploads).where(eq(feedMediaUploads.id, input.id));
        return { success: true };
      }),
    
    // Profile uploads - no approval needed
    uploadProfile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const buffer = Buffer.from(input.fileContent, "base64");
        const extension = input.fileName.split(".").pop() || "png";
        const key = `profile/${ctx.user!.id}/${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        
        const result = await db.insert(profilePhotos).values({
          userId: ctx.user!.id,
          photoUrl: url,
        });
        
        return { success: true, id: result[0]?.insertId };
      }),
    
    deleteProfilePhoto: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const photo = await db.select().from(profilePhotos).where(eq(profilePhotos.id, input.id)).limit(1);
        if (!photo[0] || photo[0].userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.delete(profilePhotos).where(eq(profilePhotos.id, input.id));
        return { success: true };
      }),
  }),

  store: router({
    list: publicProcedure.query(async () => {
      const items = await getStoreItems();
      const userNames = await getUserNames(items.map((i: { sellerId: number }) => i.sellerId));
      return items.map((i: { sellerId: number; images: unknown; [key: string]: unknown }) => ({
        ...i,
        sellerName: userNames.get(i.sellerId) || "Membro",
        images: (i.images as string[] | null) || [],
      }));
    }),
    buy: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const item = await getStoreItemById(input.id);
        if (!item) throw new TRPCError({ code: "NOT_FOUND" });
        if ((item as { status: string }).status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Item não está mais disponível" });
        }
        if ((item as { sellerId: number }).sellerId === ctx.user!.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode comprar seu próprio item" });
        }

        await updateStoreItem(input.id, { status: "sold", buyerId: ctx.user!.id });

        const db = await getDb();
        const seller = db ? await db.select().from(users).where(eq(users.id, (item as { sellerId: number }).sellerId)).limit(1) : [];
        const buyer = db ? await db.select().from(users).where(eq(users.id, ctx.user!.id)).limit(1) : [];

        const commissionEnabled = await getSetting("commission_enabled");
        const isCommissionEnabled = commissionEnabled === "true";
        const commissionRate = await getSetting("commission_rate") || "5";
        const adminMasterEmail = await getSetting("admin_master_email") || "";

        const sellerName = seller[0]?.name || "Vendedor";
        const buyerName = buyer[0]?.name || buyer[0]?.email || "Comprador";
        const sellerEmail = seller[0]?.email || "";

        const content = [
          `Nova compra na Loja L.A.A.!`,
          ``,
          `Item: ${(item as { title: string }).title}`,
          `Valor: R$ ${(item as { price: string }).price}`,
          `Comprador: ${buyerName}`,
          `Vendedor: ${sellerName}`,
          `Contato do comprador: ${buyerName}`,
          ...(isCommissionEnabled
            ? [
              ``,
              `TAXA DE COMISSÃO (${commissionRate}%): R$ ${(parseFloat((item as { price: string }).price) * parseFloat(commissionRate) / 100).toFixed(2)}`,
              `Este valor deve ser doado para manutenção do site.`,
            ]
            : []),
        ].join("\n");

        // Notificação para ADM Master
        const adminTitle = adminMasterEmail
          ? `Compra na Loja L.A.A.: ${(item as { title: string }).title} (ADM: ${adminMasterEmail})`
          : `Compra na Loja L.A.A.: ${(item as { title: string }).title}`;
        await notifyOwner({ title: adminTitle, content });

        // Notificação para vendedor
        const sellerContent = [
          `Ola ${sellerName}! Seu item foi comprado na Loja L.A.A.!`,
          ``,
          `Item: ${(item as { title: string }).title}`,
          `Valor: R$ ${(item as { price: string }).price}`,
          `Comprador: ${buyerName}`,
          ...(sellerEmail ? [``, `Email do comprador: ${buyerName}`] : []),
          ``,
          ...(isCommissionEnabled
            ? [
              `Taxa de comissao (${commissionRate}%): R$ ${(parseFloat((item as { price: string }).price) * parseFloat(commissionRate) / 100).toFixed(2)}`,
              `Lembre-se de doar este valor para manutencao do site.`,
              ``,
            ]
            : []),
          `Entre em contato com o comprador para combinar a entrega.`,
          `Contato do comprador: ${buyerName}`,
          ``,
          `Acesse o portal L.A.A. para ver detalhes.`,
        ].join("\n");

        await notifyOwner({ title: `Notificacao para vendedor - ${sellerName}`, content: sellerContent });

        return { success: true, commissionEnabled: isCommissionEnabled };
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10).max(5000),
        price: z.number().min(0),
        images: z.array(z.string()).optional(),
        category: z.enum(["replica", "acessorio", "mascara", "colete", "luvas", "oculos", "bb", "grenada", "outros"]),
        condition: z.enum(["novo", "usado", "recondicionado"]).default("usado"),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createStoreItem({
          sellerId: ctx.user!.id,
          title: input.title,
          description: input.description,
          price: String(input.price),
          images: input.images || null,
          category: input.category,
          condition: input.condition,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const item = await getStoreItemById(input.id);
        if (!item) throw new TRPCError({ code: "NOT_FOUND" });
        if ((item as { sellerId: number }).sellerId !== ctx.user!.id && ctx.user!.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteStoreItem(input.id);
        return { success: true };
      }),
    all: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const items = await db.select().from(storeItems).orderBy(storeItems.createdAt);
      const sellerIds: number[] = [];
      const seen = new Set<number>();
      for (const i of items) {
        if (!seen.has((i as { sellerId: number }).sellerId)) {
          seen.add((i as { sellerId: number }).sellerId);
          sellerIds.push((i as { sellerId: number }).sellerId);
        }
      }
      const sellerMap = await getUserNames(sellerIds);
      return items.map((i: { sellerId: number; images: unknown; [key: string]: unknown }) => ({
        ...i,
        sellerName: sellerMap.get((i as { sellerId: number }).sellerId) ?? "Membro",
        images: (i.images as string[] | null) || [],
      }));
    }),
  }),

  chat: router({
    messages: protectedProcedure
      .input(z.object({ storeItemId: z.number() }))
      .query(async ({ input }) => {
        return await getChatMessagesForItem(input.storeItemId);
      }),
    send: protectedProcedure
      .input(z.object({
        storeItemId: z.number(),
        receiverId: z.number(),
        message: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createChatMessage({
          storeItemId: input.storeItemId,
          senderId: ctx.user!.id,
          receiverId: input.receiverId,
          message: input.message,
        });
      }),
    markRead: protectedProcedure
      .input(z.object({ storeItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markChatAsReadSimple(ctx.user!.id, input.storeItemId);
        return { success: true };
      }),
  }),

  admin: router({
    settings: router({
      getAll: adminProcedure.query(async () => {
        return await getAllSettings();
      }),
      update: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
          return await setSetting(input.key, input.value);
        }),
    }),
    users: router({
      list: adminProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];
        const allUsersList = await getAllUsers();
        const profiles = await db.select().from(memberProfiles);
        const profileMap = new Map<number, any>();
        for (const p of profiles) profileMap.set(p.userId, p);
        return allUsersList.map((u: { id: number; [key: string]: unknown }) => ({ ...u, profile: profileMap.get(u.id) }));
      }),
      ban: adminProcedure
        .input(z.object({ userId: z.number(), banned: z.boolean() }))
        .mutation(async ({ input }) => {
          await banUser(input.userId, input.banned);
          return { success: true };
        }),
      promote: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          await db.update(users).set({ role: "admin" }).where(eq(users.id, input.userId));
          return { success: true };
        }),
    }),
  }),

  profile: router({
    get: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const [user] = await db.select({
          id: users.id, name: users.name, email: users.email, role: users.role,
          banned: users.banned, createdAt: users.createdAt,
        }).from(users).where(eq(users.id, input.userId)).limit(1);
        if (!user) return null;

        const profile = await getMemberProfileByUserId(input.userId);
        const photos = await getLoadoutPhotos(input.userId);
        const participations = await getGameParticipations(input.userId);

        return { user, profile, photos, participations };
      }),

    me: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getMemberProfileByUserId(ctx.user!.id);
      const photos = await getLoadoutPhotos(ctx.user!.id);
      return { ...ctx.user!, profile, photos };
    }),

    update: protectedProcedure
      .input(z.object({
        nickname: z.string().max(100).optional(),
        bio: z.string().max(1000).optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateMemberProfile(ctx.user!.id, input);
        return { success: true };
      }),

    addLoadoutPhoto: protectedProcedure
      .input(z.object({
        fileContent: z.string(),
        fileName: z.string(),
        contentType: z.string(),
        caption: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const count = await getMaxLoadoutPhotos(ctx.user!.id);
        if (count >= 5) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Limite de 5 fotos do loadout atingido" });
        }
        const buffer = Buffer.from(input.fileContent, "base64");
        const extension = input.fileName.split(".").pop() || "png";
        const key = `loadout/${ctx.user!.id}/${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return await createLoadoutPhoto({
          userId: ctx.user!.id,
          photoUrl: url,
          caption: input.caption || null,
          orderIndex: count,
        });
      }),

    deleteLoadoutPhoto: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteLoadoutPhoto(input.id, ctx.user!.id);
        return { success: true };
      }),

    joinGame: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, input.gameId)).limit(1);
        if (!game) throw new TRPCError({ code: "NOT_FOUND" });
        if (game.status !== "upcoming") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este jogo não está mais aberto para inscrições" });
        }

        return await createGameParticipation({
          userId: ctx.user!.id,
          gameId: input.gameId,
        });
      }),
  }),

  honor: router({
    list: publicProcedure.query(async () => {
      return await getHonoredMembers();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        nickname: z.string().max(100).nullable().optional(),
        photoUrl: z.string().url().nullable().optional(),
        biography: z.string().max(5000).nullable().optional(),
        yearsActive: z.string().max(50).nullable().optional(),
        role: z.string().max(100).nullable().optional(),
        isDeceased: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        return await createHonoredMember({
          name: input.name,
          nickname: input.nickname ?? null,
          photoUrl: input.photoUrl ?? null,
          biography: input.biography ?? null,
          yearsActive: input.yearsActive ?? null,
          role: input.role ?? null,
          isDeceased: input.isDeceased,
        });
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        nickname: z.string().max(100).nullable().optional(),
        photoUrl: z.string().url().nullable().optional(),
        biography: z.string().max(5000).nullable().optional(),
        yearsActive: z.string().max(50).nullable().optional(),
        role: z.string().max(100).nullable().optional(),
        isDeceased: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await updateHonoredMember(input.id, {
          name: input.name,
          nickname: input.nickname,
          photoUrl: input.photoUrl,
          biography: input.biography,
          yearsActive: input.yearsActive,
          role: input.role,
          isDeceased: input.isDeceased,
        });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteHonoredMember(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
