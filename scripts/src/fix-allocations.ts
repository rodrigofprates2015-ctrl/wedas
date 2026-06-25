import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const result = await pool.query(`
    UPDATE monthly_allocations ma
    SET allocated_coins = CASE WHEN u.role = 'hr' THEN 999999 ELSE 20 END
    FROM users u
    WHERE ma.user_id = u.id
  `);
  console.log("Updated rows:", result.rowCount);
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
