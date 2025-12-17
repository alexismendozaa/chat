import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function connectPostgres() {
  if (!process.env.DATABASE_URL) throw new Error("❌ Missing DATABASE_URL");
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT now() as now");
    console.log("Postgres connected:", r.rows[0].now);
  } finally {
    client.release();
  }
}
