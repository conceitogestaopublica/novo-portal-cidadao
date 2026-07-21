# ADR-0005: Reestruturação em src/modules/&lt;feature&gt;

## Status

`Aceito`

## Contexto

Toda tela de negócio vivia solta em `src/app/`, misturada com roteamento —
violando a Regra de Ouro "sem telas de negócio fora de `modules/`" que o
próprio `CLAUDE.md` do projeto (adaptado do front de referência) já mandava
seguir. `src/modules/` só tinha 2 componentes isolados (`ambientes-view.tsx`,
`home-view.tsx` — este último código morto, portado 1:1 do GED e sem nenhum
importador).

## Decisão

**Toda tela de negócio movida para `src/modules/<feature>/`** (fiscal, admin,
carta-servicos, solicitacoes, auth, portal), cada um com `index.ts` público.
`page.tsx` no App Router vira wrapper fino: importa o componente do módulo e
repassa `params` em rotas dinâmicas, sem lógica própria.

`home-view.tsx` (código morto confirmado — zero importadores) foi removido
nesta mesma mudança, não arquivado.

## Consequências

**Positivas:**
- `page.tsx` de cada rota agora tem ~5 linhas — fácil de auditar o que uma
  rota faz sem ler a tela inteira.
- Módulo isolado facilita a extração subsequente de `services/`+`hooks/`
  (ADR-0006) por módulo, um de cada vez, sem acoplar aos outros.

**Negativas / trade-offs:**
- Nenhuma — é relocação de arquivo + ajuste de import, sem mudança de
  comportamento (verificado por typecheck, lint e smoke test em todas as
  rotas afetadas antes de cada commit).

## Alternativas Consideradas

- **Manter estrutura por rota (`src/app/`) e só isolar lógica em hooks
  soltos:** descartado — não resolve a violação da Regra de Ouro nem dá um
  lugar natural para `index.ts` público por feature.

## Data

2026-07-21
