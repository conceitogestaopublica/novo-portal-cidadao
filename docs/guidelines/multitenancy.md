# Multitenancy

## Como o município é resolvido

Em produção, o município vem do **subdomínio** (`<municipio>.dominio.com`),
extraído em `shared/lib/extract-subdomain.ts` e resolvido para a configuração
do tenant (URLs dos 3 backends, segredo de serviço, subdomínio real do
tributário) em `shared/lib/tenant-map.ts`. Em desenvolvimento, é single-tenant,
fixado por `DEV_TENANT_SUBDOMAIN`/`DEV_TENANT_NOME`.

```typescript
import { currentTenant } from "@/shared/lib/tenant-map";

const tenant = await currentTenant();
if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
```

Chame `currentTenant()` no topo de toda rota/Server Component que acessa dado
— nunca assuma um município fixo fora de desenvolvimento.

## Como o município é propagado

- **Para o banco próprio (Prisma):** toda tabela tem a coluna `municipio`;
  toda query filtra por ele explicitamente (`where: { municipio }`). Nunca
  uma query sem esse filtro.
- **Para o backend tributário:** header `x-tenant-subdomain` (+ `x-proxy-secret`
  quando configurado), montado em `tenantHeaders()` dentro de
  `tributario.adapter.ts`.
- **Nunca confiar em município vindo do body do client** — o adapter e os
  repositórios sempre usam o `tenant`/`municipio` já resolvido no servidor via
  `currentTenant()`, nunca um campo arbitrário do request.

## Sessão e tenant

O JWT CONTRIBUINTE emitido pelo tributário é carimbado com o tenant em que foi
emitido; o próprio backend recusa (401) um token usado num tenant diferente do
resolvido pelo `Host` da requisição (fail-closed, anti-replay entre
municípios). O portal não precisa reimplementar essa checagem — ela já
acontece no backend a cada chamada de `portal-me/*`.
