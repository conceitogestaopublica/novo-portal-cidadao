-- CreateEnum
CREATE TYPE "identidade_provedor" AS ENUM ('SENHA', 'GOVBR', 'CERTIFICADO');

-- CreateTable
CREATE TABLE "portal_conta_identidades" (
    "id" UUID NOT NULL,
    "conta_id" UUID NOT NULL,
    "provedor" "identidade_provedor" NOT NULL,
    "sujeito" VARCHAR(255) NOT NULL,
    "nivel" VARCHAR(30),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_uso_em" TIMESTAMPTZ,

    CONSTRAINT "portal_conta_identidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_identidade_conta" ON "portal_conta_identidades"("conta_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_identidade_provedor_sujeito" ON "portal_conta_identidades"("provedor", "sujeito");

-- AddForeignKey
ALTER TABLE "portal_conta_identidades" ADD CONSTRAINT "portal_conta_identidades_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "portal_contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
