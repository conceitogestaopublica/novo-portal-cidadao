-- AlterTable
ALTER TABLE "portal_contas" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "portal_senha_reset" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "portal_solicitacoes" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "portal_login_tentativas" (
    "escopo" VARCHAR(20) NOT NULL,
    "chave" VARCHAR(200) NOT NULL,
    "contagem" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMPTZ,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "portal_login_tentativas_pkey" PRIMARY KEY ("escopo","chave")
);

-- CreateTable
CREATE TABLE "portal_otp_desafios" (
    "id" UUID NOT NULL,
    "contribuinte_id" UUID NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "documento" VARCHAR(14) NOT NULL,
    "municipio" VARCHAR(60) NOT NULL,
    "otp_hash" VARCHAR(255) NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_otp_desafios_pkey" PRIMARY KEY ("id")
);
