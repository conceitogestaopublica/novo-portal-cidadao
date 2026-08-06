#!/usr/bin/env node
/**
 * Exporta a Carta de Serviços de um município para um JSON — o "banco de
 * inicialização" que serve de ponto de partida para outros municípios.
 *
 * JS puro (sem TS) de propósito, igual ao `criar-admin.mjs` — evita depender de
 * ts-node/tsx só para isto.
 *
 * Por que exportar do BANCO e não do código: `catalogo-seed.ts` é a semente de
 * fábrica e não muda. O que o município tem de verdade pode ter sido editado no
 * console (ambiente renomeado, serviço despublicado, ordem trocada). Exportar do
 * banco captura a Carta REAL, que é o que faz sentido replicar.
 *
 * Uso:
 *   node prisma/scripts/exportar-catalogo.mjs --municipio=dev [--saida=arquivo.json]
 */
import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

config({ path: join(process.cwd(), ".env.local") });

function arg(nome) {
  const p = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return p ? p.slice(nome.length + 3) : undefined;
}

async function main() {
  const municipio = arg("municipio");
  const saida = arg("saida") ?? join("prisma", "catalogo-inicial.json");

  if (!municipio) {
    console.error("Uso: node prisma/scripts/exportar-catalogo.mjs --municipio=<slug> [--saida=arquivo.json]");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const [ambientes, categorias, servicos] = await Promise.all([
      prisma.portalAmbiente.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
      prisma.portalCategoria.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
      prisma.portalServico.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
    ]);

    if (!ambientes.length && !categorias.length && !servicos.length) {
      console.error(`❌ Nada encontrado para o município "${municipio}". Confira o slug.`);
      process.exit(1);
    }

    // `criadoPorId`/`atualizadoPorId` NÃO vão no arquivo: apontam para admins de
    // uma instalação específica e não fazem sentido em outra.
    const doc = {
      versao: 1,
      origem: municipio,
      // Sem data: o arquivo é versionado no git, e um carimbo de tempo faria
      // toda exportação virar diff mesmo sem mudança de conteúdo.
      ambientes: ambientes.map((a) => ({ slug: a.slug, ordem: a.ordem, dados: a.dados })),
      categorias: categorias.map((c) => ({
        slug: c.slug,
        ambienteSlug: c.ambienteSlug,
        ordem: c.ordem,
        dados: c.dados,
      })),
      servicos: servicos.map((s) => ({
        slug: s.slug,
        categoriaSlug: s.categoriaSlug,
        publicado: s.publicado,
        ordem: s.ordem,
        dados: s.dados,
      })),
    };

    writeFileSync(saida, JSON.stringify(doc, null, 2) + "\n", "utf8");
    console.log(
      `✅ ${saida} — ${doc.ambientes.length} ambiente(s), ${doc.categorias.length} categoria(s), ${doc.servicos.length} serviço(s) de "${municipio}"`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Falha:", e.message ?? e);
  process.exit(1);
});
