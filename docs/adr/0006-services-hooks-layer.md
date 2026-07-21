# ADR-0006: Camada services/ + hooks/ por módulo

## Status

`Aceito`

## Contexto

Depois da ADR-0005, os componentes de cada módulo ainda faziam
`useQuery`/`useMutation` inline, direto no `.tsx` — funcional, mas divergente
do padrão real do `gpd-web-tributario-front` (confirmado contra código, não
só documentação: 35 pastas `services/` + 20 `hooks/` reais em uso lá, ex.:
`modules/divida-ativa/services/cdas.service.ts` + `hooks/use-cdas.ts`).
Sem essa camada, toda lógica de chamada de rede, tipos de resposta e chave de
cache ficava misturada com JSX no mesmo arquivo.

## Decisão

**`services/<nome>.service.ts`** (funções puras sobre `requestJsonOrError`/
`postJson`) **+ `hooks/use-<nome>.ts`** (`useQuery`/`useMutation` consumindo
só o service) **por módulo**. Componentes passam a ser puramente
apresentacionais — só JSX + estado de UI local (aba ativa, campo de
formulário não persistido). Chaves de cache mantidas como array estruturado,
idênticas às usadas antes onde já havia invalidação cruzada entre
componentes do mesmo módulo.

Hooks usam o `QueryClientProvider` ambiente do app (`src/app/providers.tsx`)
normalmente — nunca um `QueryClient` paralelo/local ao módulo. (Uma extração
inicial do módulo `auth` introduziu por engano um client paralelo só para
funcionar num teste sem provider; foi revertido — ver `docs/guidelines/
data-fetching.md`. A forma correta de testar hook com React Query é embrulhar
o `render`/`renderHook` do teste com um `QueryClientProvider` de teste, não
mudar o hook de produção.)

## Consequências

**Positivas:**
- Lógica de rede testável isoladamente (`renderHook` + `fetch` mockado), sem
  precisar montar o componente inteiro.
- Consistência real com o projeto irmão, não só com o texto do `CLAUDE.md`.

**Negativas / trade-offs:**
- Mais arquivos por módulo (um par services/hooks por área de dado) — trade-
  off aceito em troca de separação de responsabilidade e testabilidade.

## Alternativas Consideradas

- **Manter `useQuery`/`useMutation` inline nos componentes:** era o estado
  antes desta ADR — descartado por divergir do padrão real do projeto irmão
  e dificultar teste isolado da lógica de dado.

## Data

2026-07-21
