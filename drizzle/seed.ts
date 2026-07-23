import "dotenv/config";
import { getDb } from "../server/db";
import * as schema from "./schema";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";

/**
 * Esta é a função principal que executará nossas operações de seeding.
 */
async function main() {
  console.log("🌱 Iniciando o povoamento (seeding) do banco de dados...");

  // Chamamos uma função de seeding específica para cada um dos nossos arquivos CSV.
  // Adicione mais chamadas aqui conforme você cria mais funções de seeding.
  await seedUsers();
  await seedGames();
  // await seedMemberProfiles(); // Exemplo para outra tabela

  console.log("✅ Povoamento do banco de dados finalizado.");

  // Sai do processo para evitar que ele fique travado.
  process.exit(0);
}

async function seedUsers() {
  const db = getDb();
  const filePath = path.join(process.cwd(), "seed-data", "users.csv");

  try {
    // Verifica se o arquivo existe
    await fs.access(filePath);
  } catch (error) {
    console.log("🟡 users.csv não encontrado, pulando o seeding de usuários.");
    return;
  }

  console.log("  -> Inserindo dados da tabela: users...");
  const fileContent = await fs.readFile(filePath);

  // Analisa o arquivo CSV. Assumimos que a primeira linha contém os cabeçalhos.
  const records: any[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  if (records.length === 0) {
    console.log("  -> Nenhum registro encontrado em users.csv.");
    return;
  }

  // Transforma os registros analisados para o formato esperado pelo nosso schema Drizzle.
  // IMPORTANTE: Você pode precisar ajustar os nomes das propriedades (ex: 'open_id')
  // para corresponder aos cabeçalhos das colunas no SEU arquivo CSV.
  const usersToInsert: (typeof schema.users.$inferInsert)[] = records.map(
    (record) => ({
      // Mapeia as colunas do CSV para os campos do schema
      openId: record.openId || record.open_id, // Exemplo: tentando camelCase e snake_case
      name: record.name,
      email: record.email,
      loginMethod: record.loginMethod || "manus", // Fornece um padrão se estiver faltando
      role: record.role === "admin" ? "admin" : "user", // Garante que o 'role' é válido
      banned: record.banned === "true" || record.banned === "1", // Converte para booleano
      // Lida com campos de data. Garanta que sejam strings de data válidas no CSV.
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
      lastSignedIn: record.lastSignedIn
        ? new Date(record.lastSignedIn)
        : new Date(),
    }),
  );

  // Insere os dados no banco de dados.
  // `onConflictDoNothing` evitará erros se um usuário com o mesmo `openId` já existir.
  await db
    .insert(schema.users)
    .values(usersToInsert)
    .onConflictDoNothing({
      target: schema.users.openId,
    });

  console.log(`  -> ${usersToInsert.length} usuários inseridos/ignorados.`);
}

// Você pode criar funções semelhantes para suas outras tabelas.
async function seedGames() {
  // TODO: Implemente a lógica para popular a tabela 'games'
  console.log("🟡 O seeding para 'games' ainda não foi implementado. Por favor, implemente em drizzle/seed.ts");
}

// Executa a função principal de seeding e trata quaisquer erros.
main().catch((e) => {
  console.error("❌ Ocorreu um erro durante o povoamento do banco de dados:");
  console.error(e);
  process.exit(1);
});