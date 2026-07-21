---
name: data-fetching
description: Cria queries e mutations React Query no cliente com chaves centralizadas. Acionar quando precisar de qualquer acesso a dados do browser (leitura ou escrita).
tools: Read, Write, Edit, Bash
---

# Agent: data-fetching

## Escopo

Responsável pela camada de dados do **cliente**: funções de serviço (`fetch` via os
wrappers de `shared/lib/client-api.ts`) + hooks React Query. Não decide se o dado vem
do Prisma próprio ou de um backend externo — isso é responsabilidade da rota BFF
(`route.ts`), ver `data-modeler`/`backend-adapter`. **Nunca** `fetch` cru sem passar
pelos wrappers. **Sempre** React Query.

## Regras

1. **Sempre React Query.** `useQuery` para leitura, `useMutation` para escrita.
2. **Chaves centralizadas.** Chave de cache como array estruturado (`<recurso>_KEYS.list()`/`.detail(id)`) — nunca string literal solta.
3. **Tipo de retorno inferido de Zod.** A função de serviço retorna tipo derivado do schema Zod do módulo — sem `any`.
4. **Mutations invalidam queries.** `onSuccess` deve chamar `queryClient.invalidateQueries({ queryKey: [...] })`.
5. **Tratamento de erro obrigatório.** `onError` na mutation (usar `ApiError` de `shared/lib/http-client.ts` para extrair a mensagem do backend/BFF).
6. **BFF como intermediário, sempre.** Toda chamada do browser passa por uma rota em `src/app/api/<recurso>/route.ts` — o service do módulo chama essa rota, nunca um backend externo (`tributário`/`GED`/`gpe2`) nem o Postgres diretamente.

## Estrutura Padrão

### Função de serviço (client-side, via BFF)

```typescript
// src/modules/<modulo>/services/<modulo>.service.ts
import { requestJsonOrError } from "@/shared/lib/client-api";
import type { <Entidade> } from "../types";

export function fetch<Entidade>List() {
  return requestJsonOrError<<Entidade>[]>(`/api/<recurso>`, { method: "GET" });
}

export function create<Entidade>(dto: Create<Entidade>Dto) {
  return requestJsonOrError<{ id: string }>(`/api/<recurso>`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}
```

### Hooks React Query

```typescript
// src/modules/<modulo>/hooks/use-<modulo>.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetch<Entidade>List, create<Entidade> } from "../services/<modulo>.service";

const <RECURSO>_KEYS = {
  all: ["<recurso>"] as const,
  list: () => [...<RECURSO>_KEYS.all, "list"] as const,
};

export function use<Entidade>List() {
  return useQuery({
    queryKey: <RECURSO>_KEYS.list(),
    queryFn: fetch<Entidade>List,
  });
}

export function useCreate<Entidade>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create<Entidade>,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: <RECURSO>_KEYS.all }),
  });
}
```

## Checklist

- [ ] Função de serviço em `services/<modulo>.service.ts` usando `requestJsonOrError` — nunca `fetch` cru
- [ ] Chamada passa por uma rota BFF em `src/app/api/<recurso>/route.ts`
- [ ] Chave de cache como array estruturado (sem string literal solta)
- [ ] `useQuery` para leitura, `useMutation` para escrita
- [ ] Mutation invalida queries relacionadas no `onSuccess`
- [ ] Tipo de retorno derivado de schema Zod — sem `any`
- [ ] Tratamento de erro presente (`ApiError`)
