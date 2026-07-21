# Auth — duas sessões separadas

Diferente do ERP irmão (RBAC granular por permissão), este portal tem duas
sessões simples e independentes:

## Sessão do cidadão (`shared/lib/portal-session.ts`)

- Login por **documento + senha** (conta própria do portal) ou **documento +
  OTP** (resolve o contribuinte no tributário, emite um desafio, valida e
  emite o JWT CONTRIBUINTE).
- Cookie httpOnly assinado (HMAC), TTL de 8h — é a identidade durável.
- O JWT CONTRIBUINTE do tributário (TTL 15min) é renovado **transparentemente**
  pelo BFF (`shared/adapters/portal-me-client.ts` → `ensureToken()`) usando o
  `contribuinteId` da própria sessão como prova de identidade — sem pedir OTP
  de novo a cada 15 minutos.
- Modelo "uma pessoa, várias empresas": a sessão guarda a lista de
  `representados` (titular + empresas que a pessoa representa) resolvida no
  login; trocar de identidade ativa (`POST /api/auth/atuar-como`) só reemite o
  JWT para outra identidade **que já esteja nessa lista** — nunca aceita um
  `contribuinteId` arbitrário do body sem essa checagem de posse.

## Sessão do admin (`shared/lib/admin-session.ts`)

- Login por **senha única** (`PORTAL_ADMIN_SENHA`), sem usuário — é o
  servidor do município que edita a Carta de Serviços.
- Cookie httpOnly assinado, TTL de 8h.
- Lockout por tentativas erradas (`admin-login-lock.ts`).
- `requireAdmin()` no topo de toda página/rota do admin — guard server-side,
  nunca só uma checagem client-side.

## Regra comum às duas

**Guard sempre no servidor**, nunca só na UI:

```typescript
// página do cidadão autenticado
import { requireCidadao } from "@/shared/lib/portal-session";
export default async function Page() {
  const cidadao = await requireCidadao(); // redireciona para /entrar se ausente
  ...
}
```

```typescript
// página do admin
import { requireAdmin } from "@/shared/lib/admin-session";
export default async function Page() {
  await requireAdmin(); // redireciona para /admin/entrar se ausente
  ...
}
```

Um componente client pode checar sessão para efeito cosmético (mostrar/
esconder botão), mas isso nunca é a fonte de verdade de segurança.
