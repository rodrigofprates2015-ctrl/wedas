import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "../../lib/db/src/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  // Run migrations first (push schema to DB)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      coin_conversion_rate NUMERIC(10,2) NOT NULL DEFAULT 0.10,
      monthly_coin_limit INTEGER NOT NULL DEFAULT 100,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Check if already seeded
  let userCount = 0;
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    userCount = Number((result.rows[0] as { count: string }).count);
  } catch {
    // Table doesn't exist yet — will be created by drizzle push separately
    console.log("Users table not found — skipping seed (run drizzle push first)");
    await pool.end();
    return;
  }

  if (userCount > 0) {
    console.log(`Banco já possui ${userCount} usuário(s) — seed ignorado.`);
    await pool.end();
    return;
  }

  console.log("Banco vazio — executando seed...");

  const hash = async (p: string) => bcrypt.hash(p, 10);

  // Settings
  await db.insert(schema.settingsTable).values({
    coinConversionRate: "0.10",
    monthlyCoinLimit: 100,
  }).onConflictDoNothing();
  console.log("✓ Settings");

  // Categories
  await db.insert(schema.categoriesTable).values([
    { name: "Trabalho em Equipe", icon: "🤝", active: true },
    { name: "Inovação", icon: "💡", active: true },
    { name: "Liderança", icon: "🚀", active: true },
    { name: "Atendimento ao Cliente", icon: "⭐", active: true },
    { name: "Resultados", icon: "🎯", active: true },
    { name: "Aprendizado", icon: "📚", active: true },
  ]).onConflictDoNothing();
  console.log("✓ Categories");

  // Users
  await db.insert(schema.usersTable).values([
    {
      name: "Ana Lima",
      email: "rh@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Recursos Humanos",
      position: "Analista de RH",
      role: "hr",
      active: true,
    },
    {
      name: "Rodrigo Santos",
      email: "rodrigo@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Tecnologia",
      position: "Desenvolvedor",
      role: "employee",
      active: true,
    },
    {
      name: "Carlos Mendes",
      email: "carlos@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Tecnologia",
      position: "Gerente de Engenharia",
      role: "manager",
      active: true,
    },
    {
      name: "Fernanda Costa",
      email: "fernanda@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Marketing",
      position: "Analista de Marketing",
      role: "employee",
      active: true,
    },
    {
      name: "Lucas Oliveira",
      email: "lucas@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Vendas",
      position: "Executivo de Vendas",
      role: "employee",
      active: true,
    },
  ]).onConflictDoNothing();
  console.log("✓ Users");

  await pool.end();
  console.log("\nSeed completo!");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
