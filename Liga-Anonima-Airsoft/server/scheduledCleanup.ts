import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { games, gameParticipations, gameBans } from "../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";

/**
 * Heartbeat handler: remove participações que não enviaram comprovante dentro do prazo.
 * 
 * Lógica de strikes:
 * - Quando o prazo expira, registra um strike na tabela game_bans (incrementa strikes)
 * - Na 1a falha: remove a participação, jogador pode se reinscrever
 * - Na 2a falha: bane permanentemente do jogo (reason preenchido)
 * 
 * POST /api/scheduled/payment-cleanup
 */
export async function paymentCleanupHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!(user as any).isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "DB unavailable" });
    }

    // Buscar jogos ativos (upcoming) que têm prazo de pagamento
    const activeGames = await db.select().from(games).where(
      eq(games.status, "upcoming" as any)
    );

    let removed = 0;
    let banned = 0;

    for (const game of activeGames) {
      const deadlineDays = game.paymentDeadlineDays ?? 3;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() - deadlineDays);

      // Buscar participações que não pagaram e estão além do prazo
      const expiredParticipations = await db.select().from(gameParticipations)
        .where(and(
          eq(gameParticipations.gameId, game.id),
          eq(gameParticipations.paymentStatus, "none"),
          lt(gameParticipations.createdAt, deadline)
        ));

      for (const participation of expiredParticipations) {
        // Verificar/criar registro de strikes na tabela game_bans
        const [existingRecord] = await db.select().from(gameBans)
          .where(and(eq(gameBans.userId, participation.userId), eq(gameBans.gameId, game.id)))
          .limit(1);

        let currentStrikes = 0;

        if (existingRecord) {
          // Incrementar strikes
          currentStrikes = existingRecord.strikes + 1;
          await db.update(gameBans)
            .set({ strikes: currentStrikes })
            .where(eq(gameBans.id, existingRecord.id));
          
          if (currentStrikes >= 2 && !existingRecord.reason) {
            // Banir permanentemente (preencher reason = ban efetivo)
            await db.update(gameBans)
              .set({ reason: "Não cumpriu o prazo de pagamento 2 vezes" })
              .where(eq(gameBans.id, existingRecord.id));
            banned++;
          }
        } else {
          // Primeiro strike: criar registro com strikes=1, sem reason (não é ban ainda)
          currentStrikes = 1;
          await db.insert(gameBans).values({
            userId: participation.userId,
            gameId: game.id,
            strikes: 1,
            reason: null, // null = não banido ainda, apenas strike registrado
          });
        }

        // Remover a participação
        await db.delete(gameParticipations).where(eq(gameParticipations.id, participation.id));
        
        // Decrementar contador de jogadores
        if ((game.currentPlayers ?? 0) > 0) {
          await db.update(games).set({
            currentPlayers: (game.currentPlayers ?? 0) - 1,
          }).where(eq(games.id, game.id));
        }

        removed++;
      }
    }

    return res.json({
      ok: true,
      removed,
      banned,
      gamesChecked: activeGames.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Scheduled] payment-cleanup error:", error);
    return res.status(500).json({
      error: error.message || "Unknown error",
      stack: error.stack,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
