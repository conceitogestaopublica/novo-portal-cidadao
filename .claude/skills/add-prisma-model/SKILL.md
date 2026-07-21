---
name: add-prisma-model
description: Adicionar ou alterar um model Prisma do banco próprio do portal (portal_cidadao) e gerar a migration.
---

# Skill: add-prisma-model

## Passos

### 1. Editar `prisma/schema.prisma`

```prisma
model PortalSenhaReset {
  id        String    @id @default(uuid()) @db.Uuid
  contaId   String    @map("conta_id") @db.Uuid
  tokenHash String    @map("token_hash") @db.VarChar(255)
  expiraEm  DateTime  @map("expira_em") @db.Timestamptz
  usadoEm   DateTime? @map("usado_em") @db.Timestamptz
  criadoEm  DateTime  @default(now()) @map("criado_em") @db.Timestamptz

  @@index([tokenHash], map: "idx_portal_senha_reset_token")
  @@index([contaId], map: "idx_portal_senha_reset_conta")
  @@map("portal_senha_reset")
}
```

Convenções: model `PascalCase` singular, campo `camelCase`, `@@map`/`@map` para a
tabela/coluna `snake_case` já existente no banco (o schema Prisma não deve forçar
renomear tabelas em produção).

### 2. Gerar a migration

```bash
npx prisma migrate dev --name <descricao-curta-em-kebab-case>
```

Isso cria `prisma/migrations/<timestamp>_<descricao>/migration.sql` e já regenera o
client (`npx prisma generate`).

Em produção/CI, migrations já geradas são aplicadas com:

```bash
npx prisma migrate deploy
```

Nunca editar uma tabela direto via `psql` fora desse fluxo.

### 3. Atualizar (ou criar) o repositório

`shared/repos/<entidade>-repo.ts` ou `shared/catalogo/<entidade>-repo.ts` — função
pura por operação, sem classe, usando `prisma` de `shared/lib/prisma.ts`:

```typescript
import "server-only";
import { prisma } from "@/shared/lib/prisma";

export async function criarTokenReset(contaId: string, tokenHash: string, expiraEm: Date) {
  return prisma.portalSenhaReset.create({
    data: { contaId, tokenHash, expiraEm },
  });
}
```

### 4. Transações

Quando uma operação faz mais de uma escrita que precisa ser atômica (ex.: consumir
token de reset + trocar senha), usar `prisma.$transaction`:

```typescript
export async function consumirTokenETrocarSenha(tokenHash: string, senhaHash: string) {
  return prisma.$transaction(async (tx) => {
    const reset = await tx.portalSenhaReset.updateMany({
      where: { tokenHash, usadoEm: null, expiraEm: { gt: new Date() } },
      data: { usadoEm: new Date() },
    });
    if (reset.count === 0) return false;
    const { contaId } = await tx.portalSenhaReset.findFirstOrThrow({ where: { tokenHash } });
    await tx.portalConta.update({ where: { id: contaId }, data: { senhaHash } });
    return true;
  });
}
```

### 5. Colunas JSONB (catálogo)

O catálogo guarda o objeto inteiro em `dados` (Json no Prisma). Validar com Zod ao
ler/escrever, nunca confiar no `any`/`JsonValue` do client:

```typescript
const servico = servicoSeedSchema.parse(row.dados);
```

## Checklist

- [ ] Model definido em `prisma/schema.prisma` com `@map`/`@@map` para os nomes reais do banco
- [ ] Migration gerada via `npx prisma migrate dev --name ...` — nunca SQL manual em produção
- [ ] Repositório atualizado, usando `prisma`, não `pg`
- [ ] Transação usada quando há mais de uma escrita atômica
- [ ] Coluna JSONB validada com Zod na leitura/escrita
- [ ] Toda tabela nova escopada por `municipio` (salvo justificativa)
