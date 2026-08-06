#!/usr/bin/env node
/**
 * Inicializa a Carta de Serviços de um município a partir do JSON exportado.
 *
 * Uso:
 *   node prisma/scripts/importar-catalogo.mjs --municipio=santoantonio [--arquivo=...] [--sobrescrever]
 *
 * Por padrão **não sobrescreve**: item cujo slug já existe naquele município é
 * pulado. Isso protege o município que já editou a Carta dele — reimportar não
 * pode desfazer o trabalho da prefeitura. Use `--sobrescrever` conscientemente.
 *
 * Também registra cada item em `portal_seed_aplicado`, para a semente automática
 * (`semearNovidades`) não tentar reinserir depois o que já entrou por aqui.
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

config({ path: join(process.cwd(), ".env.local") });

function arg(nome) {
  const p = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return p ? p.slice(nome.length + 3) : undefined;
}
const temFlag = (nome) => process.argv.includes(`--${nome}`);

async function main() {
  const municipio = arg("municipio");
  const arquivo = arg("arquivo") ?? join("prisma", "catalogo-inicial.json");
  const sobrescrever = temFlag("sobrescrever");

  if (!municipio) {
    console.error("Uso: node prisma/scripts/importar-catalogo.mjs --municipio=<slug> [--arquivo=...] [--sobrescrever]");
    process.exit(1);
  }

  const doc = JSON.parse(readFileSync(arquivo, "utf8"));
  if (doc.versao !== 1) {
    console.error(`❌ Versão de arquivo não suportada: ${doc.versao}`);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const conta = { inseridos: 0, pulados: 0, atualizados: 0 };

  try {
    // Tudo ou nada: um município não pode ficar com metade da Carta se algo falhar.
    await prisma.$transaction(async (tx) => {
      const grupos = [
        { nome: "ambiente", itens: doc.ambientes, tabela: tx.portalAmbiente },
        { nome: "categoria", itens: doc.categorias, tabela: tx.portalCategoria },
        { nome: "servico", itens: doc.servicos, tabela: tx.portalServico },
      ];

      for (const { nome, itens, tabela } of grupos) {
        for (const item of itens ?? []) {
          const chave = { municipio_slug: { municipio, slug: item.slug } };
          const existente = await tabela.findUnique({ where: chave });

          if (existente && !sobrescrever) {
            conta.pulados++;
          } else if (existente) {
            const { slug: _s, ...resto } = item;
            void _s;
            await tabela.update({ where: chave, data: resto });
            conta.atualizados++;
          } else {
            await tabela.create({ data: { municipio, ...item } });
            conta.inseridos++;
          }

          // Marca como já oferecido, para a semente automática não reinserir depois.
          await tx.portalSeedAplicado.createMany({
            data: [{ chave: `${municipio}:${nome}:${item.slug}` }],
            skipDuplicates: true,
          });
        }
      }
    });

    console.log(
      `✅ "${municipio}": ${conta.inseridos} inserido(s), ${conta.atualizados} atualizado(s), ${conta.pulados} pulado(s)`,
    );
    if (conta.pulados && !sobrescrever) {
      console.log("   (já existiam — use --sobrescrever para substituir, ciente de que isso desfaz edições do município)");
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Falha:", e.message ?? e);
  process.exit(1);
});
