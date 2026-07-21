# ADR-0001: Prisma como ORM do banco próprio do portal

## Status

`Aceito`

## Contexto

O banco `portal_cidadao` (contas, catálogo da Carta de Serviços, solicitações,
recuperação de senha) era acessado por SQL cru via `pg.Pool`, com o schema
versionado à mão em `db/schema.sql`. O próprio arquivo documentava a razão:
"antes deste arquivo as tabelas existiam só porque foram criadas à mão — um
clone do repositório não subia". Não havia migration versionada, e o projeto
irmão (`gpd-web-tribut-rio`) usa Prisma com driver adapter (`@prisma/adapter-pg`)
como padrão único de acesso a dado.

## Decisão

**Prisma (client + migrations) como único ORM do banco próprio do portal**,
com o mesmo padrão de driver adapter do backend: `PrismaClient` construído com
`PrismaPg` sobre um `pg.Pool` (não o cliente HTTP padrão do Prisma), em
`shared/lib/prisma.ts`.

Regras decorrentes:
- `prisma/schema.prisma` é a única fonte de verdade do schema — nunca alterar
  uma tabela direto via `psql`.
- Toda mudança de schema gera uma migration (`npx prisma migrate dev`), nunca
  SQL manual em produção (`npx prisma migrate deploy`).
- Repositórios (`shared/repos/*`, `shared/catalogo/*`) usam `PrismaClient`,
  nunca `pg` cru. Duas operações que dependem de `COALESCE` atômico sobre o
  valor atual da linha (`solicitacao-repo.ts`, correção pontual de JSONB em
  `catalogo-repo.ts`) usam `$executeRaw` do próprio Prisma Client — não é
  regressão para SQL cru, é o escape-hatch oficial do Prisma para o que o
  query builder não expressa.

## Consequências

**Positivas:**
- Clone do repositório volta a funcionar sozinho (`docker compose up` +
  `npx prisma migrate deploy`), sem depender de um dump `.sql` mantido à mão.
- Tipos gerados a partir do schema — sem `Record<string, unknown>` manual nos
  repositórios.
- Consistência com o backend irmão (mesmo padrão de driver adapter).

**Negativas / trade-offs:**
- Uma migration "init" foi baseada (`prisma migrate resolve --applied`) contra
  o banco de dev já existente, em vez de gerada do zero — o histórico de
  migrations não reflete a evolução real anterior a esta ADR, só o estado no
  momento da adoção.

## Alternativas Consideradas

- **Manter SQL cru + dump versionado:** foi o que existia; descartado porque
  o próprio código já documentava o problema (clone não sobe sozinho).
- **Drizzle ORM:** mais leve, mas divergiria do padrão já estabelecido no
  backend irmão — descartado por consistência entre projetos.

## Data

2026-07-21
