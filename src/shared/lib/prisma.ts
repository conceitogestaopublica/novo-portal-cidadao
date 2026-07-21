import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/** Client Prisma do banco próprio do portal. Ancorado no globalThis (dev/HMR). */
const g = globalThis as typeof globalThis & { __portalPrisma?: PrismaClient };

function criarClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = g.__portalPrisma ?? (g.__portalPrisma = criarClient());
