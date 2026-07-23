import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Função para desabilitar prepared statements, necessária para o Neon
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

async function runMigrations() {
  const originalConnectionString = process.env.DATABASE_URL;
  if (!originalConnectionString) {
    throw new Error("DATABASE_URL is not set in the environment variables.");
  }

  const connectionString = applyNeonWorkaround(originalConnectionString);

  console.log("⏳ Running migrations...");
  const startTime = Date.now();

  try {
    // Usamos um Pool do 'pg' para a migração
    const pool = new Pool({ connectionString });
    const db = drizzle(pool);

    // A pasta de migrações é relativa à raiz do projeto
    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("✅ Migrations applied successfully!");
    await pool.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  const endTime = Date.now();
  console.log(`✨ Done in ${(endTime - startTime) / 1000}s`);
  process.exit(0);
}

runMigrations();