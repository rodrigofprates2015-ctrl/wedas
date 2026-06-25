import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/src/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  // Settings
  await db.delete(schema.settingsTable);
  await db.insert(schema.settingsTable).values({
    coinConversionRate: "0.10",
    monthlyCoinLimit: 100,
  });
  console.log("✓ Settings");

  // Categories
  await db.delete(schema.categoriesTable);
  await db.insert(schema.categoriesTable).values([
    { name: "Trabalho em Equipe", icon: "🤝", active: true },
    { name: "Inovação", icon: "💡", active: true },
    { name: "Liderança", icon: "🚀", active: true },
    { name: "Atendimento ao Cliente", icon: "⭐", active: true },
    { name: "Resultados", icon: "🎯", active: true },
    { name: "Aprendizado", icon: "📚", active: true },
  ]);
  console.log("✓ Categories");

  // Users
  const hash = async (p: string) => bcrypt.hash(p, 10);

  await db.delete(schema.usersTable);
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
  ]);
  console.log("✓ Users");

  await pool.end();
  console.log("\nSeed completo!");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
