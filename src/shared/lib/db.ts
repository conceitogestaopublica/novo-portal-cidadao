import "server-only";
import { Pool } from "pg";

/** Pool do banco do portal (Postgres). Ancorado no globalThis (dev/HMR). */
const g = globalThis as typeof globalThis & { __portalPool?: Pool };

export function db(): Pool {
  if (!g.__portalPool) {
    g.__portalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
  }
  return g.__portalPool;
}
