# Data Model — os dois mundos de dados

Ver [ADR-0001](../adr/0001-prisma-orm.md).

## Regra Principal

Este portal fala com **dois mundos de dados completamente separados**. Antes de
escrever qualquer acesso a dado, identifique qual dos dois você precisa —
nunca misture os dois no mesmo repositório/service.

### 1. Banco próprio do portal (`portal_cidadao`) — via Prisma

Contas do cidadão, sessões, catálogo da Carta de Serviços (ambientes,
categorias, serviços), o espelho local de solicitações, tokens de recuperação
de senha.

```typescript
import { prisma } from "@/shared/lib/prisma";

const conta = await prisma.portalConta.findUnique({
  where: { documento_municipio: { documento, municipio } },
});
```

- Schema em `prisma/schema.prisma` — única fonte de verdade. Nunca alterar
  tabela via `psql`; toda mudança é uma migration (`npx prisma migrate dev`).
- Repositórios em `shared/repos/*` e `shared/catalogo/*` usam `PrismaClient`,
  nunca `pg` cru.
- Toda tabela é escopada por `municipio` — o portal serve vários municípios.

### 2. Backends externos (tributário, GED, gpe2) — via adapters

Débitos, guias, NFS-e, DMS, certidões, parcelamento, caixa postal (DTE),
protocolo/ouvidoria.

```typescript
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";

const adapter = new TributarioAdapter(tenant);
const resultado = await adapter.resolver(documento);
```

- Chamadas vivem só em `shared/adapters/*.adapter.ts`, com `"server-only"` no
  topo — nunca do browser, nunca de fora de uma rota BFF/Server Component.
- Endpoints seguem o contrato oficial documentado em `docs/design/
  portal-cidadao.md` do repositório `gpd-web-tribut-rio` (`portal-auth/
  contribuinte/*`, `portal-me/*`) — verificado nesta sessão: os ~25 endpoints
  usados batem exatamente com os controllers reais do backend, sem
  reimplementação paralela.
- Segredo de serviço (`X-Service-Token`/`PROXY_SHARED_SECRET`) só em
  `shared/config/env.ts` e nos adapters — nunca em resposta JSON, nunca em
  `NEXT_PUBLIC_*`.

## Qual usar em cada situação

| Preciso de... | Uso |
|---|---|
| Login/cadastro do cidadão | Prisma (conta) + adapter tributário (resolver contribuinte, emitir JWT) |
| Débitos, guias, certidões, parcelamento, NFS-e, DMS, caixa postal | Adapter tributário (`portal-me/*`) |
| Catálogo da Carta de Serviços (o que aparece na home/busca) | Prisma |
| "Minhas solicitações" (o registro que o cidadão vê) | Prisma |
| Tramitação real do protocolo (o que a prefeitura decide) | Adapter gpe2 |

## Ver também

- [`.claude/agents/data-modeler.md`](../../.claude/agents/data-modeler.md) — mudança de schema Prisma
- [`.claude/agents/backend-adapter.md`](../../.claude/agents/backend-adapter.md) — chamada a backend externo
- [`.claude/skills/add-prisma-model/SKILL.md`](../../.claude/skills/add-prisma-model/SKILL.md)
- [`.claude/skills/add-adapter-call/SKILL.md`](../../.claude/skills/add-adapter-call/SKILL.md)
