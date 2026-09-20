import postgres from "postgres";

/**
 * One Postgres client per serverless instance.
 *
 * `max: 1` because every Vercel function is its own process — a bigger pool
 * just holds connections the instance cannot use. `prepare: false` is required
 * when the connection string points at a pooler (Supabase's pgbouncer, Neon's
 * pooled endpoint), which does not support prepared statements.
 */
const globalForDb = globalThis as unknown as {
  _sql?: ReturnType<typeof postgres>;
};

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (!globalForDb._sql) {
    globalForDb._sql = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDb._sql;
}
