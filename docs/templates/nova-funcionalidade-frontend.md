# PROMPT — Nova Funcionalidade (Frontend)

> **Como usar:** copie este arquivo, preencha os campos `[entre colchetes]` e cole no
> Claude Code já dentro deste repositório. Não edite as seções fixas — elas são o
> contrato de comportamento. Apague esta linha e o bloco de instrução ao colar.

> **Escopo:** este template é do **portal do cidadão** (`gpd-portal-cidadao`).
> Os caminhos e nomes abaixo já refletem a estrutura real deste repositório
> (`src/modules/`, grupos `(portal)`/`(admin)`). Para o backend NestJS, use
> [nova-funcionalidade-backend.md](nova-funcionalidade-backend.md).

---

## Contexto da governança (não ignore)

Antes de qualquer coisa, **leia e siga**: `CLAUDE.md` (em especial as **Regras de Ouro**),
os agents em `.claude/agents/`, as skills em `.claude/skills/`, os ADRs em `docs/adr/`
e os guias em `docs/guidelines/`. Esta tarefa está subordinada a todas as Regras de Ouro
do projeto. Em caso de conflito entre este pedido e a governança, a governança vence —
e você me avisa.

Acione os agents/skills pertinentes (no mínimo: `reuse-auditor` antes de criar código,
`feature-architect` se for módulo novo, `ui-builder` para telas/componentes,
`form-builder` para formulários, `data-fetching` para queries/mutations,
`backend-adapter` se for chamar backend externo, `data-modeler` se mexer no schema
Prisma, `accessibility-reviewer` ao final; skill `create-feature`, `add-page`,
`add-form`, `add-data-query`, `add-shadcn-component`, `add-prisma-model` ou
`add-adapter-call` conforme o caso).

---

## O que eu quero

**Funcionalidade:** [nome curto da funcionalidade]

**Módulo:** [nome do módulo existente em `src/modules/` OU "novo módulo: <nome>"]

**Descrição da interface e do fluxo:**
[Descreva as telas, o fluxo do usuário e o comportamento esperado. Seja específico
sobre o que está dentro e fora do escopo.]

**Telas/rotas:**
[Liste as rotas no App Router. Indique se ficam em `(portal)` (área do cidadão,
pública ou autenticada) ou em `(admin)` (console da Carta de Serviços, sessão própria).]

**Dados consumidos:**
[Diga de qual dos DOIS MUNDOS vem cada dado — ver Regra de Ouro 9:
 - banco próprio do portal (contas, sessões, catálogo, solicitações) → Prisma;
 - fiscal / GED / gpe2 → sempre via `shared/adapters/*`, server-side.
Liste as rotas BFF (`src/app/api/*`) que serão chamadas. Se o endpoint externo ainda
não existir, NÃO presuma o contrato — veja "Regras desta tarefa".]

**Formulários (se aplicável):**
[Campos, validações e regras. Lembre: schema Zod único compartilhado entre form e API.]

**Visibilidade / controle de acesso:**
[Quem enxerga o quê. Diga se a tela é pública, exige sessão do cidadão, ou exige
sessão de admin. Ver `docs/guidelines/auth.md`. Este portal NÃO tem modelo de RBAC
por permissão nomeada — se você precisa de um, isso é decisão estrutural: pergunte.]

---

## Regras desta tarefa (fixas — não alterar)

1. **Não invente nada.** Se uma tela, campo, fluxo, contrato de API ou regra de acesso
   não estiver definido acima, **pare e me pergunte** — não escolha por conta própria.
   Liste as dúvidas de forma enumerada com sua recomendação.
2. **Reutilize antes de criar.** Rode o `reuse-auditor`: procure em `src/components/ui`,
   `src/components/common`, `src/shared/lib`, `src/shared/adapters` e nos outros
   `src/modules/*` por algo que já resolva parte do problema. Componentes de UI vêm do
   shadcn/ui primeiro. Só crie algo novo se não houver reaproveitamento, e justifique.
3. **Respeite a fronteira de módulo.** O módulo fica isolado em `src/modules/<nome>/`
   e só expõe seu `index.ts`. Nunca importe internos de outro módulo. A fronteira é
   verificada por ESLint (ADR-0007) — não desative a regra.
4. **Sem telas de negócio fora de `modules/`.** Layout e componentes base ficam em
   `src/components/`; telas de negócio vivem em `src/modules/`.
5. **Data fetching** sempre via React Query, com chaves centralizadas e tipadas. Nada
   de `fetch` solto em componente. Toda chamada do browser passa por uma rota BFF em
   `src/app/api/*` — nunca direto a backend externo nem direto ao Postgres.
6. **Formulários** sempre React Hook Form + Zod; o mesmo schema valida o form e tipa o
   payload. Não duplique regras de validação. Atenção ao ADR-0004: o style `base-nova`
   não tem `Form`/`FormField` — use `register()` direto, e `<Button type="submit">`
   é obrigatório.
7. **Estilo:** só classes Tailwind + tokens de tema do shadcn; nenhum HEX solto;
   usar `cn()`. Ícones sempre `lucide-react`, nunca Font Awesome (ADR-0002).
8. **Estados de UI:** trate loading, erro e vazio de forma consistente, reutilizando
   os componentes de `src/components/common/`.
9. **Server vs Client Component:** Server por padrão; `'use client'` só com
   estado/efeito/evento. Mantenha a `page.tsx` como Server Component fino.
10. **Dois mundos de dados — nunca misture** (Regra de Ouro 9). Dado do próprio portal
    → Prisma (`shared/lib/prisma.ts`). Dado fiscal/GED/gpe2 → `shared/adapters/*`,
    server-side. Nunca acesso direto a outro banco, nunca SQL cru.
11. **Segredo de servidor nunca chega ao client** (Regra de Ouro 10). `X-Service-Token`,
    `PROXY_SHARED_SECRET`, `PORTAL_ADMIN_SENHA`, credenciais de banco: só em código com
    `"server-only"`. Nunca em Client Component, nunca em resposta JSON.
12. **Multitenancy:** o município é resolvido por subdomínio
    (`shared/lib/extract-subdomain.ts` + `shared/lib/tenant-map.ts`) — consuma o que
    existe, não reimplemente. Toda tabela do portal é escopada por `municipio`: nenhuma
    query sem esse filtro. Nunca confie em município vindo do body do client.
13. **Acessibilidade:** rode o `accessibility-reviewer` (foco, labels, roles, contraste).
    Não quebre o que o shadcn/ui já entrega.
14. **Sem dependências novas** sem me perguntar antes. Proibido `npm install <pacote>`
    sem confirmação.
15. **Testes:** entregue testes da regra principal no padrão do projeto
    (vitest + @testing-library/react).
16. **ADR:** se introduzir uma decisão estrutural (novo padrão, novo tipo de layout,
    nova fronteira), crie um ADR em `docs/adr/` a partir de `docs/adr/0000-template.md`.
17. **Atualize a documentação** (`CLAUDE.md`, `docs/guidelines/*`) se o comportamento
    público mudar.

---

## Ordem de execução

1. Confirme que entendeu o escopo. Liste todas as dúvidas/ambiguidades ANTES de codar
   — em especial qualquer contrato de API ainda indefinido. Não gere código com dúvida
   em aberto.
2. Apresente um plano curto: arquivos a criar/alterar, o que será reutilizado, e o que
   (se algo) será criado do zero e por quê.
3. Após meu OK, implemente seguindo a governança.
4. Rode `npx tsc --noEmit`, `npm run lint` e `npm test` — e me mostre o resultado real.
5. Ao final, liste: arquivos tocados, o que foi reutilizado, o que foi criado novo,
   testes adicionados, ADR criado (se houver), e o que ficou deliberadamente de fora.

---

## Checklist antes de finalizar

- [ ] Não inventei nenhuma tela/campo/fluxo/contrato não especificado — perguntei o resto.
- [ ] Procurei e reutilizei `components/*`, `shared/*` e outros `modules/*`.
- [ ] Componentes de UI vieram do shadcn/ui antes de eu criar algo novo.
- [ ] O módulo é isolado e só expõe seu `index.ts`; ESLint de fronteira passando.
- [ ] Data fetching via React Query através do BFF; formulários via RHF + Zod.
- [ ] Só tokens de tema — nenhum HEX solto; ícones lucide-react.
- [ ] Loading/erro/vazio tratados de forma consistente.
- [ ] Dois mundos de dados respeitados; nenhuma query fora do escopo de município.
- [ ] Nenhum segredo de servidor alcançável pelo client.
- [ ] Acessibilidade verificada.
- [ ] Nenhuma dependência nova sem aprovação.
- [ ] `tsc --noEmit`, `lint` e `test` passando — resultado colado na resposta.
- [ ] ADR criado se houve decisão estrutural.
