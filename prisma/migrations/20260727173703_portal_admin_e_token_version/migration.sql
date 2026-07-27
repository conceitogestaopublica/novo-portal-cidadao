-- AlterTable
ALTER TABLE "portal_ambientes" ADD COLUMN     "atualizado_por_id" UUID,
ADD COLUMN     "criado_por_id" UUID;

-- AlterTable
ALTER TABLE "portal_categorias" ADD COLUMN     "atualizado_por_id" UUID,
ADD COLUMN     "criado_por_id" UUID;

-- AlterTable
ALTER TABLE "portal_contas" ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "portal_servicos" ADD COLUMN     "atualizado_por_id" UUID,
ADD COLUMN     "criado_por_id" UUID;

-- CreateTable
CREATE TABLE "portal_admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "municipio" VARCHAR(60),
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_admins_email_key" ON "portal_admins"("email");

-- AddForeignKey
ALTER TABLE "portal_ambientes" ADD CONSTRAINT "portal_ambientes_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "portal_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_ambientes" ADD CONSTRAINT "portal_ambientes_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "portal_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_categorias" ADD CONSTRAINT "portal_categorias_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "portal_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_categorias" ADD CONSTRAINT "portal_categorias_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "portal_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_servicos" ADD CONSTRAINT "portal_servicos_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "portal_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_servicos" ADD CONSTRAINT "portal_servicos_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "portal_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
