# Data Fetching

Ver [ADR-0003](../adr/0003-client-api-http-client.md) e [ADR-0006](../adr/0006-services-hooks-layer.md).

## Regra Principal

**Todo acesso a dado do cliente passa por `services/` + `hooks/` (React
Query).** Nunca `fetch`/`useState`+`useEffect` solto num componente, nunca
`requestJsonOrError`/`postJson` chamado direto dentro do `.tsx`.

```typescript
// modules/<nome>/services/<nome>.service.ts
import { requestJsonOrError, postJson } from "@/shared/lib/client-api";

export function fetchAlgo(id: string) {
  return requestJsonOrError<Algo>(`/api/algo/${id}`);
}
export function criarAlgo(body: AlgoBody) {
  return postJson<{ id: string }>("/api/algo", body);
}
```

```typescript
// modules/<nome>/hooks/use-algo.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAlgo, criarAlgo } from "../services/algo.service";

export function useAlgo(id: string) {
  return useQuery({ queryKey: ["algo", id], queryFn: () => fetchAlgo(id) });
}
export function useCriarAlgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarAlgo,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["algo"] }),
  });
}
```

O componente consome só o hook — sem saber que existe `fetch` por trás.

## BFF como intermediário, sempre

Toda chamada do browser passa por uma rota em `src/app/api/<recurso>/route.ts`,
que decide o mundo de dado (Prisma próprio ou adapter de backend externo — ver
`docs/guidelines/data-model.md`). O `service` do módulo nunca chama um backend
externo nem o Postgres diretamente — só a rota BFF.

## Tratamento de erro e sessão expirada

```typescript
import { ApiError, isSessaoExpirada } from "@/shared/lib/http-client";

try {
  await mutateAsync(dados);
} catch (e) {
  if (isSessaoExpirada(e)) { router.push("/entrar"); return; }
  setError("root", { message: e instanceof Error ? e.message : "Erro" });
}
```

`ApiError.status` é o código HTTP real — nunca comparar por string mágica
(o projeto usava `throw new Error("SESSAO")` antes da ADR-0003; não repita
esse padrão em código novo).

## Testando hooks de React Query

Todo hook precisa de um `QueryClientProvider` ancestral. Para componente, use
o helper `src/test/render-with-providers.tsx` (`renderWithProviders`). Para
hook isolado (`renderHook`), monte um wrapper local com um `QueryClient` novo
por teste (`retry: false`). **Nunca** contorne isso criando um `QueryClient`
paralelo dentro do hook de produção só para o teste funcionar sem provider —
isso fragmenta o cache real do app (foi um erro real cometido e revertido
nesta base de código, ver ADR-0006).

Mocke `fetch` (`vi.stubGlobal("fetch", ...)`), nunca o hook/service — o teste
deve validar o caminho real até a rede.
