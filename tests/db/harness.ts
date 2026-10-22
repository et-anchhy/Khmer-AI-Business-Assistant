import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const root = path.resolve(import.meta.dirname, "../..");
const migrationsDir = path.join(root, "supabase/migrations");

/** Fresh in-memory Postgres with the Supabase stand-in and every migration applied, in order. */
export async function createTestDatabase(): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { pg_trgm } });
  await db.exec(readFileSync(path.join(import.meta.dirname, "supabase-stub.sql"), "utf8"));

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
  return db;
}

/**
 * Runs `fn` exactly as the API would for a signed-in user: as the
 * `authenticated` role with JWT claims set, so RLS and grants apply.
 * The transaction is always rolled back, so each call starts clean.
 */
export async function asUser<T>(db: PGlite, userId: string, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return asRole(db, "authenticated", { sub: userId, role: "authenticated" }, fn);
}

export async function asAnon<T>(db: PGlite, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return asRole(db, "anon", { role: "anon" }, fn);
}

class Rollback<T> extends Error {
  constructor(public value: T) {
    super("rollback");
  }
}

async function asRole<T>(
  db: PGlite,
  role: "authenticated" | "anon",
  claims: Record<string, string>,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  try {
    await db.transaction(async (tx) => {
      await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
      await tx.exec(`set local role ${role}`);
      throw new Rollback(await fn(tx));
    });
  } catch (error) {
    if (error instanceof Rollback) return error.value as T;
    throw error;
  }
  throw new Error("unreachable");
}
