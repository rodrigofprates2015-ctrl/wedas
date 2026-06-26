import pg from "pg";

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

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('employee', 'manager', 'hr');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE recognition_status AS ENUM ('active', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'employee',
        active BOOLEAN NOT NULL DEFAULT true,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS recognitions (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        coins INTEGER NOT NULL,
        message TEXT NOT NULL,
        status recognition_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        cancelled_at TIMESTAMPTZ,
        cancelled_by INTEGER REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS monthly_allocations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        allocated_coins INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        coin_conversion_rate NUMERIC(10,4) NOT NULL DEFAULT 0.10,
        monthly_coin_limit INTEGER NOT NULL DEFAULT 100
      );
    `);

    console.log("✓ Migrations complete");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
