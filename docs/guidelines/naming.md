# Convenções de Nomenclatura

## Arquivos e símbolos

- **Arquivos:** `kebab-case.tsx`/`.ts` — `fiscal-resumo.tsx`, `use-fiscal-resumo.ts`, `fiscal-resumo.service.ts`
- **Componentes React:** `PascalCase` — `FiscalResumo`, `PortalShell`
- **Hooks:** `useCamelCase` — `useFiscalResumo`, `useCriarSolicitacao`
- **Variáveis/funções:** `camelCase`
- **Constantes:** `SCREAMING_SNAKE_CASE`

## Por tipo de arquivo dentro de um módulo

| Pasta | Padrão | Exemplo |
|---|---|---|
| `components/` | `<nome>.tsx`, export `PascalCase` | `fiscal-dms.tsx` → `FiscalDms` |
| `hooks/` | `use-<nome>.ts`, export `useAlgumaCoisa` | `use-fiscal-dms.ts` → `useDmsLista`, `useEntregarDms` |
| `services/` | `<nome>.service.ts`, export `fetchAlgo`/`criarAlgo`/`atualizarAlgo` | `fiscal-dms.service.ts` |
| `schemas/` | `<nome>.schema.ts`, export `algoSchema` + `type AlgoInput` | `auth.schema.ts` |

## Hooks — padrão semântico

- `use<Entidade>` — lista (`useFiscalGuias`)
- `use<Entidade>(id)` — detalhe (`useDmsDetalhe(id)`)
- `useCriar<Entidade>`/`useSalvar<Entidade>`/`useExcluir<Entidade>` — mutations
- `use<Acao><Entidade>` — ação específica (`useEmitirNfse`, `useAderirParcelamento`)

## Módulos

Nome do módulo em `kebab-case`, mesmo nome da pasta em `src/modules/`:
`fiscal`, `admin`, `carta-servicos`, `solicitacoes`, `auth`, `portal`.

## Props

Interface `PascalCase` + sufixo `Props`, sem prefixo `I` (`FiscalDmsProps`,
não `IFiscalDmsProps`).
