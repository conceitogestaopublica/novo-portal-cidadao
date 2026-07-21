---
name: add-adapter-call
description: Adicionar uma chamada a um backend externo (tributário, GED, gpe2) via adapter, sem expor segredos ao client.
---

# Skill: add-adapter-call

## Passos

### 1. Verificar se o endpoint já existe no backend

Antes de escrever a chamada, confirme no repositório `../gpd-web-tribut-rio`:
- `docs/design/portal-cidadao.md` — desenho geral da integração.
- `src/modules/portal-integration/` — controllers `portal-auth/contribuinte/*` e
  `portal-me/*` já disponíveis.

Se o dado que você precisa já existe em `portal-me/*`, use-o — não peça (nem crie)
um endpoint novo sem necessidade real.

### 2. Adicionar a função no adapter

`shared/adapters/tributario.adapter.ts` (ou `gpe2.adapter.ts`/`ged.adapter.ts`):

```typescript
import "server-only";
import { env } from "@/shared/config/env";

async function chamarTributario<T>(
  path: string,
  municipio: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${env.tributarioBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
      "X-Service-Token": env.portalServiceToken(),
      "x-tenant-subdomain": municipio,
    },
  });
  if (!res.ok) {
    throw new Error(`tributario ${path} respondeu ${res.status}`);
  }
  return res.json();
}

export function buscarDebitos(contaId: string, municipio: string) {
  return chamarTributario<Debito[]>(`/portal-me/debitos`, municipio, {
    headers: { Authorization: `Bearer ${/* token do contribuinte, da sessão */ ""}` },
  });
}
```

### 3. Chamar o adapter da rota BFF

`src/app/api/fiscal/debitos/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { requireCidadao } from "@/shared/lib/portal-session";
import { buscarDebitos } from "@/shared/adapters/tributario.adapter";

export async function GET(req: Request) {
  const cidadao = await requireCidadao(); // id vem da sessão, nunca do client
  const debitos = await buscarDebitos(cidadao.contribuinteId, cidadao.municipio);
  return NextResponse.json(debitos);
}
```

### 4. Nunca pular o adapter

Um Client Component ou Server Component **nunca** chama `fetch(env.tributarioBaseUrl() + ...)`
diretamente — sempre passa pela função do adapter, que centraliza header de serviço,
tenant e tratamento de erro. Se dois lugares do código estão montando a mesma URL,
extraia para o adapter.

### 5. Erros e indisponibilidade

Backend externo fora do ar deve virar um erro identificável, não um 500 cru:

```typescript
export class BackendExternoIndisponivelError extends Error {}

// no adapter, dentro do catch/status check:
if (!res.ok) throw new BackendExternoIndisponivelError(`tributario ${path}: ${res.status}`);
```

A rota BFF captura esse erro e devolve uma mensagem que o hook/formulário do módulo consegue mostrar.

## Checklist

- [ ] Endpoint já existente no backend verificado antes de propor algo novo
- [ ] Chamada centralizada em `shared/adapters/*.adapter.ts`, com `"server-only"`
- [ ] Município passado explicitamente, resolvido no servidor (nunca do body do client)
- [ ] Id do contribuinte vem da sessão do portal (`requireCidadao`), nunca do client
- [ ] Segredo de serviço lido de `shared/config/env.ts`
- [ ] Rota BFF é a única chamadora do adapter — nenhum Client/Server Component monta a URL direto
- [ ] Erro de indisponibilidade mapeado para algo que o client consiga exibir
