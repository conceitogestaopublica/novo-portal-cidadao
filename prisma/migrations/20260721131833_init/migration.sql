-- Baseline: registra no histórico do Prisma Migrate o schema que já existia no
-- banco `portal_cidadao` (criado à mão via db/schema.sql, agora substituído por
-- este schema.prisma). Este SQL é equivalente ao schema já aplicado — resolvido
-- como aplicado via `prisma migrate resolve --applied`, nunca executado contra
-- um banco que já tem essas tabelas.

-- CreateTable
CREATE TABLE "portal_ambientes" (
    "municipio" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "dados" JSONB NOT NULL,

    CONSTRAINT "portal_ambientes_pkey" PRIMARY KEY ("municipio","slug")
);

-- CreateTable
CREATE TABLE "portal_categorias" (
    "municipio" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ambiente_slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "dados" JSONB NOT NULL,

    CONSTRAINT "portal_categorias_pkey" PRIMARY KEY ("municipio","slug")
);

-- CreateTable
CREATE TABLE "portal_servicos" (
    "municipio" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoria_slug" TEXT NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "dados" JSONB NOT NULL,

    CONSTRAINT "portal_servicos_pkey" PRIMARY KEY ("municipio","slug")
);

-- CreateTable
CREATE TABLE "portal_contas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documento" VARCHAR(14) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(150),
    "telefone" VARCHAR(30),
    "senha_hash" VARCHAR(255),
    "contribuinte_id" UUID,
    "municipio" VARCHAR(60) NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "portal_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_solicitacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "protocolo" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "conta_id" UUID,
    "documento" TEXT,
    "nome" TEXT NOT NULL,
    "contato" TEXT,
    "servico_slug" TEXT NOT NULL,
    "servico_titulo" TEXT NOT NULL,
    "mensagem" TEXT,
    "situacao" TEXT NOT NULL DEFAULT 'ABERTA',
    "protocolo_numero" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "protocolo_id" TEXT,
    "protocolo_sistema" TEXT,

    CONSTRAINT "portal_solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_seed_aplicado" (
    "chave" TEXT NOT NULL,
    "aplicado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "portal_seed_aplicado_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "portal_senha_reset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conta_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "usado_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "portal_senha_reset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_portal_cat_ambiente" ON "portal_categorias"("municipio", "ambiente_slug");

-- CreateIndex
CREATE INDEX "idx_portal_serv_categoria" ON "portal_servicos"("municipio", "categoria_slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_conta_doc_municipio" ON "portal_contas"("documento", "municipio");

-- CreateIndex
CREATE UNIQUE INDEX "uq_portal_solic_protocolo" ON "portal_solicitacoes"("municipio", "protocolo");

-- CreateIndex
CREATE INDEX "idx_portal_solic_conta" ON "portal_solicitacoes"("conta_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "idx_portal_senha_reset_token" ON "portal_senha_reset"("token_hash");

-- CreateIndex
CREATE INDEX "idx_portal_senha_reset_conta" ON "portal_senha_reset"("conta_id");
