import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "../../lib/db/src/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const connectionString = process.env.DATABASE_URL;
const isLocal =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
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

  // Always ensure the RH admin user exists (upsert by email)
  await db.insert(schema.usersTable).values({
    name: "Bruno Dener de Campos Oliveira",
    email: "rh@wedas.com",
    passwordHash: await bcrypt.hash("senha123", 10),
    department: "Recursos Humanos",
    position: "Analista de RH",
    role: "hr",
    active: true,
  }).onConflictDoNothing();

  if (userCount > 0) {
    console.log(`Banco já possui ${userCount} usuário(s) — seed de dados completo ignorado (admin garantido).`);
    await pool.end();
    return;
  }

  console.log("Banco vazio — executando seed completo...");

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
      name: "Bruno Dener de Campos Oliveira",
      email: "rh@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Recursos Humanos",
      position: "Analista de RH",
      role: "hr",
      active: true,
    },
    {
      name: "Amanda Fabbro",
      email: "amanda.fabbro@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Amanda Helena Granado",
      email: "amanda.granado@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "André",
      email: "andre@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Athos Lisboa",
      email: "athos.lisboa@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Beto",
      email: "beto@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Bruna Garcia",
      email: "bruna.garcia@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Bruno Franzoni Capistrano",
      email: "bruno.capistrano@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Caio Martinez",
      email: "caio.martinez@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Camila Bernardi de Godoy Gavino",
      email: "camila.gavino@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Boca",
      email: "boca@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Caroline Bartolassi",
      email: "caroline.bartolassi@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Caroline Gomes",
      email: "caroline.gomes@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Dani Castro",
      email: "dani.castro@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Felipe Galvão",
      email: "felipe.galvao@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Flávia Menezes",
      email: "flavia.menezes@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Gabriel Azevedo Garcia",
      email: "gabriel.garcia@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Gabriel Del'Lomo",
      email: "gabriel.dellomo@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Gabriel Nery",
      email: "gabriel.nery@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Gerson José dos Santos",
      email: "gerson.santos@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Giovanna Oberle",
      email: "giovanna.oberle@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Gisele Ambrosio dos Santos",
      email: "gisele.santos@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "João Capozzi",
      email: "joao.capozzi@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Jorrie Dias de Farias",
      email: "jorrie.farias@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Julia Emi Santos Fontenelle de Araujo",
      email: "julia.araujo@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Julia Hirano",
      email: "julia.hirano@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Karen Martinez",
      email: "karen.martinez@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Leonardo Santareli",
      email: "leonardo.santareli@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Letícia Santos",
      email: "leticia.santos@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Lilian Duvaizan",
      email: "lilian.duvaizan@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Marcos Silva Magalhães",
      email: "marcos.magalhaes@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Mario Reys",
      email: "mario.reys@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Paula Cristina Mazzo",
      email: "paula.mazzo@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Paulo Argollo",
      email: "paulo.argollo@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Pedro da Cunha Mendes",
      email: "pedro.mendes@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Pedro Natan",
      email: "pedro.natan@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Rafael Roberto dos Santos",
      email: "rafael.santos@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Rodrigo Freitas",
      email: "rodrigo.freitas@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Rodrigo Silva Veronez",
      email: "rodrigo.veronez@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Stefany França",
      email: "stefany.franca@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Thiago Toledo",
      email: "thiago.toledo@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Vanessa Mendes de Sá",
      email: "vanessa.sa@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
      role: "employee",
      active: true,
    },
    {
      name: "Vivian Barile Alexandrino",
      email: "vivian.alexandrino@wedas.com",
      passwordHash: await hash("senha123"),
      department: "Geral",
      position: "Colaborador",
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
