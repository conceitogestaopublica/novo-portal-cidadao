---
name: add-data-query
description: Criar query ou mutation React Query com chave centralizada, tipagem Zod e invalidação de cache.
---

# Skill: add-data-query

## Passos

### 1. Criar (ou atualizar) a função de serviço

`src/modules/<modulo>/services/<modulo>.service.ts`

Usar `requestJsonOrError` (client-side) contra a rota BFF do módulo:

```typescript
import { requestJsonOrError } from "@/shared/lib/client-api";
import type { <Entidade> } from "../types";

export function fetch<Entidade>List() {
  return requestJsonOrError<<Entidade>[]>(`/api/<recurso>`, { method: "GET" });
}

export function fetch<Entidade>ById(id: string) {
  return requestJsonOrError<<Entidade>>(`/api/<recurso>/${id}`, { method: "GET" });
}

export function create<Entidade>(dto: Create<Entidade>Dto) {
  return requestJsonOrError<{ id: string }>(`/api/<recurso>`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}
```

A rota BFF correspondente (`src/app/api/<recurso>/route.ts`) chama `prisma`
diretamente (se for dado do próprio portal) ou um adapter de
`shared/adapters/*` (se for dado externo) — nunca as duas coisas na mesma função.

### 2. Definir chaves de cache

```typescript
const <RECURSO>_KEYS = {
  all: ["<recurso>"] as const,
  lists: () => [...<RECURSO>_KEYS.all, "list"] as const,
  detail: (id: string) => [...<RECURSO>_KEYS.all, "detail", id] as const,
};
```

### 3. Criar hooks React Query

`src/modules/<modulo>/hooks/use-<modulo>.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetch<Entidade>List,
  fetch<Entidade>ById,
  create<Entidade>,
} from "../services/<modulo>.service";
import type { Create<Entidade>Dto } from "../types";

export function use<Entidade>List() {
  return useQuery({
    queryKey: <RECURSO>_KEYS.lists(),
    queryFn: fetch<Entidade>List,
  });
}

export function use<Entidade>(id: string) {
  return useQuery({
    queryKey: <RECURSO>_KEYS.detail(id),
    queryFn: () => fetch<Entidade>ById(id),
    enabled: !!id,
  });
}

export function useCreate<Entidade>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Create<Entidade>Dto) => create<Entidade>(dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: <RECURSO>_KEYS.lists() }),
  });
}
```

### 4. Tratamento de erro

`requestJsonOrError` lança `ApiError` (de `@/shared/lib/http-client`) com a mensagem
do backend/BFF já normalizada. O hook do React Query expõe `isError`/`error` —
exibir com `role="alert"` no componente, com `onAction={() => query.refetch()}`
quando fizer sentido tentar de novo (ex.: backend externo indisponível).

## Checklist

- [ ] Função de serviço usa `requestJsonOrError` — nunca `fetch` cru
- [ ] Chamada passa por uma rota BFF em `src/app/api/<recurso>/route.ts`
- [ ] Chaves de cache seguem hierarquia (`all → lists → detail(id)`)
- [ ] `useQuery` para leitura, `useMutation` para escrita/ação
- [ ] Toda mutation invalida as queries relacionadas no `onSuccess`
- [ ] Tipo de retorno sem `any` — derivado de schemas Zod
- [ ] `enabled: !!id` em queries que dependem de um ID opcional
