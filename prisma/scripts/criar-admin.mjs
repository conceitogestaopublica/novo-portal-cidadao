#!/usr/bin/env node
/**
 * Cria (ou promove a admin uma) conta de administrador da Carta de Serviços.
 * JS puro (sem TS) de propósito — evita depender de ts-node/tsx só pra isso.
 *
 * Uso:
 *   node prisma/scripts/criar-admin.mjs --email=admin@municipio.gov.br --nome="Nome" --senha="..." [--municipio=dev]
 *
 * Sem --municipio: fica null (acesso a todos os municípios deste deploy).
 */
import { config } from "dotenv";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import argon2 from "argon2";

config({ path: join(process.cwd(), ".env.local") });

function arg(nome) {
  const p = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return p ? p.slice(nome.length + 3) : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const nome = arg("nome");
  const senha = arg("senha");
  const municipio = arg("municipio") ?? null;

  if (!email || !nome || !senha) {
    console.error("Uso: node prisma/scripts/criar-admin.mjs --email=... --nome=\"...\" --senha=\"...\" [--municipio=...]");
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("Senha precisa de pelo menos 8 caracteres.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const senhaHash = await argon2.hash(senha);
    const admin = await prisma.portalAdmin.upsert({
      where: { email },
      create: { email, nome, senhaHash, municipio },
      update: { nome, senhaHash, municipio, ativo: true, deletedAt: null, deletedBy: null },
    });
    console.log(`✅ Admin pronto: ${admin.email} (${admin.id})${municipio ? ` — escopado a "${municipio}"` : " — todos os municípios"}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Falha:", e.message ?? e);
  process.exit(1);
});
