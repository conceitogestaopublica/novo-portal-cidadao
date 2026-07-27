# ADR-0008: DES-IF (bancos) portado para o padrão de módulo atual

## Status

`Aceito`

## Contexto

A branch `feat/desif-contribuinte` (Joel, 3 commits reais: banco envia a
DES-IF pelo portal RF-116, encerramento de competência, botão de comprovante
de entrega) implementava a tela do banco que declara DES-IF pelo portal —
funcionalidade real e ainda desejada, confirmada contra o backend
(`gpd-web-tribut-rio`, `PortalMeDesifController` ativo: `/instituicoes`,
`/importar`, `/declaracoes`, `/encerrar`, `/comprovante`). A branch nasceu de
um merge-base de 2026-07-15 — antes de toda a modernização deste projeto
(ADR-0001 a ADR-0007: Prisma, shadcn/lucide, `client-api`/`http-client`,
RHF+Zod, `modules/<feature>/{components,hooks,services,schemas}`,
services+hooks, boundary de módulo). O código da branch era 100%
pré-modernização: um `page.tsx` de 555 linhas sem separação de módulo,
`getJson`/`send`/`motivo` locais duplicando exatamente o que
`client-api.ts`/`http-client.ts` já centralizam (o mesmo tratamento que
ADR-0003/commit `7e60c80` já tinha dado ao resto do projeto), Tailwind cru em
vez de tokens shadcn, `onClick` imperativo em vez de RHF+Zod.

## Decisão

**Portar manualmente para o padrão atual, não mesclar a branch direto.**
`page.tsx` de 555 linhas vira `modules/fiscal/{components,hooks,services,
schemas}/*desif*`, seguindo o molde de `fiscal-nfse`/`fiscal-dms` já
existentes: `desif.schema.ts` (RHF+Zod, `z.input`/`z.output`), `use-desif.ts`
(React Query, chaves `["desif", ...]`), `desif.service.ts`
(`client-api.ts`/`http-client.ts`, sem `fetch()` solto), `fiscal-desif.tsx`
(tokens shadcn, ícones lucide em `inline-flex`, `<Button type="submit">`).
O BFF (`api/fiscal/desif/*`) já usava `proxyPortalMe*` corretamente — copiado
sem alteração. A lógica de negócio original (regras de comprovante,
encerramento só para módulo `APURACAO_MENSAL` validado, guia zero não é erro)
estava correta — só a casca precisava de modernização.

## Consequências

**Positivas:**
- Módulo DES-IF consistente com todo o resto do projeto — próxima pessoa que
  mexer nele não encontra um outlier de estilo antigo.
- Cobertura de teste (`desif.schema.test.ts`, `use-desif.test.tsx`) alinhada
  com os outros módulos fiscais, que a branch original não tinha.

**Negativas / trade-offs:**
- Reescrita manual custou bem mais que um merge direto teria custado — só se
  justifica porque o gap entre o merge-base e o `master` atual era grande
  (reestruturação inteira do projeto, não só commits incrementais).

## Alternativas Consideradas

- **Merge direto da branch:** mais rápido, mas reintroduziria o padrão
  pré-modernização no meio de um projeto já convergido — descartado.
- **Reescrever do zero sem aproveitar a branch:** desperdiçaria a lógica de
  negócio já correta e testada (regras de encerramento, comprovante) —
  descartado.

## Data

2026-07-27
