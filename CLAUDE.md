<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Portal do Cidadão — Frontend (Next.js)

**Status:** MVP em construção — este arquivo estabelece o padrão a partir de 2026-07-21, seguindo a arquitetura irmã de `../gpd-web-tributario-front`.

---

## 🛑 SYSTEM DISPATCHER: LEITURA OBRIGATÓRIA DE CONTEXTO

Você é estritamente proibido de escrever qualquer código, componente ou hook sem ANTES invocar ativamente a ferramenta de leitura de ficheiros (`cat` / read) para carregar os agentes e skills relevantes para a memória ativa.

Mapeie a solicitação do usuário e carregue APENAS os ficheiros correspondentes da árvore `.claude/`:

1. BOOTSTRAP DE NOVO MÓDULO DE NEGÓCIO:
   -> Ler: `.claude/agents/feature-architect.md`
   -> Ler: `.claude/skills/create-feature/SKILL.md`
   -> Ler: `.claude/agents/reuse-auditor.md`

2. CONSTRUÇÃO DE PÁGINAS, COMPONENTES OU UI:
   -> Ler: `.claude/agents/ui-builder.md`
   -> Ler: `.claude/agents/accessibility-reviewer.md`
   -> Ler: `.claude/skills/add-page/SKILL.md` (se for uma página/rota)
   -> Ler: `.claude/skills/add-shadcn-component/SKILL.md` (se for injetar componente base)

3. IMPLEMENTAÇÃO DE FORMULÁRIOS (RHF + Zod):
   -> Ler: `.claude/agents/form-builder.md`
   -> Ler: `.claude/skills/add-form/SKILL.md`

4. LEITURA/ESCRITA NO BANCO PRÓPRIO DO PORTAL (Prisma):
   -> Ler: `.claude/agents/data-modeler.md`
   -> Ler: `.claude/skills/add-prisma-model/SKILL.md`

5. CHAMADA A BACKEND EXTERNO (tributário, GED, gpe2):
   -> Ler: `.claude/agents/backend-adapter.md`
   -> Ler: `.claude/skills/add-adapter-call/SKILL.md`

6. INTEGRAÇÃO DE DADOS NO CLIENTE (React Query):
   -> Ler: `.claude/agents/data-fetching.md`
   -> Ler: `.claude/skills/add-data-query/SKILL.md`

Regra de Validação: A sua PRIMEIRA ação visível no terminal deve ser o uso da ferramenta para ler estes ficheiros. Não assuma que conhece as regras de UI, styling, dados ou integração deste repositório de cor.

---

## Regras de Ouro

Estas regras se aplicam a todos os agentes e toda contribuição neste repositório. Não há exceções.

1. **Nunca crie nada aleatório ou não solicitado.** Pergunte primeiro. Em caso de dúvida, prefira fazer uma pergunta a criar algo errado.
2. **Sempre reutilize antes de criar.** Componentes de UI vêm primeiro do shadcn/ui. Verifique `components/` e `modules/*/` antes de criar qualquer componente, hook, service ou util novo. Use o agente `reuse-auditor` quando necessário.
3. **Não adicione dependências por conta própria.** Qualquer pacote novo exige aprovação explícita do responsável pelo projeto. Proibido rodar `npm install <pacote>` sem confirmação.
4. **Consistência acima de preferência pessoal.** Siga os padrões deste repositório e do `gpd-web-tributario-front` (naming, estrutura, estilo de código) — os dois projetos são irmãos e devem convergir.
5. **Arquitetura modular e evolutiva.** Cada módulo de negócio é isolado em `src/modules/<nome>/`. Um módulo nunca importa internos de outro — apenas o `index.ts` público.
6. **Sem telas de negócio fora de `modules/`.** Layout, providers e componentes base ficam em `components/` e `providers/`. Telas de negócio vivem em `modules/`.
7. **Pare e reporte ambiguidade.** Nunca assuma em silêncio. Se o requisito não está claro, pergunte antes de implementar.
8. **Toda decisão estrutural vira um ADR em `docs/adr/`.** Novas features significativas, mudanças de stack, padrões globais — tudo documentado como ADR.
9. **Dois mundos de dados, dois caminhos — nunca misture.** Dados do PRÓPRIO portal (contas, sessões, catálogo, solicitações) → Prisma, banco `portal_cidadao`. Dados fiscais/GED/gpe2 → sempre via `shared/adapters/*`, nunca acesso direto a outro banco. Ver `.claude/agents/data-modeler.md` e `.claude/agents/backend-adapter.md`.
10. **Segredo de servidor nunca chega ao client.** `X-Service-Token`/`PROXY_SHARED_SECRET`, `PORTAL_ADMIN_SENHA`, credenciais de banco — só em código com `"server-only"`, nunca em Client Component, nunca em resposta JSON.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js App Router (16) |
| Linguagem | TypeScript strict (`"strict": true` no `tsconfig.json`) |
| Estilo | Tailwind CSS v4 + CSS Variables |
| Componentes UI | shadcn/ui |
| Ícones | `lucide-react` (nunca Font Awesome/CDN — ver `shared/lib/icon-registry.tsx` para ícones vindos de dado/JSONB) |
| Notificações | `sonner` (toasts) |
| Estado servidor | React Query (TanStack Query v5) |
| Formulários | React Hook Form + Zod resolver |
| Validação | Zod |
| Banco próprio do portal | PostgreSQL via **Prisma** (`prisma/schema.prisma`, banco `portal_cidadao`) — nunca SQL cru |
| Backends externos | tributário (NestJS, multi-tenant, `X-Service-Token`), GED (Laravel), gpe2 (Laravel) — sempre via `shared/adapters/*`, server-side |
| HTTP | wrappers `fetch` (`shared/lib/http-client.ts`, `shared/lib/client-api.ts`) + BFF (route handlers em `src/app/api/*`); sem axios |
| Testes | vitest + @testing-library/react |
| Dark mode | Via CSS variables do shadcn + `dark:` classes Tailwind |

---

## Estrutura de Pastas

```
src/
  app/
    (portal)/       # grupo de rotas do cidadão — públicas e autenticadas
    (admin)/        # console admin da Carta de Serviços (sessão própria)
    api/            # route handlers Next.js — BFF (nunca pulado pelo client)
  components/
    ui/             # componentes shadcn/ui (gerados via CLI, não editar à mão)
    common/         # EmptyState, ErrorState, Skeleton, etc.
  modules/          # módulos de negócio isolados (cada um com index.ts público)
    auth/           # login (senha e OTP), cadastro, recuperação de senha, "atuar como"
    fiscal/         # nfse, dms, certidão, parcelamento, caixa postal, dívida ativa, prestei
    carta-servicos/ # ambientes, categorias, serviços — vitrine pública
    solicitacoes/   # "minhas solicitações" (espelho do protocolo/PAE)
    admin/          # console de edição da Carta de Serviços
  shared/           # infraestrutura e integrações cross-cutting
    adapters/       # chamadas server-side aos backends externos (tributario, gpe2, ged)
    lib/            # http-client, client-api, prisma client, sessão, tenant, etc.
    catalogo/       # repositórios Prisma do catálogo (leitura pública + admin)
    config/env.ts   # validação de env
    types/
  proxy.ts          # se necessário: guard de sessão + propagação de tenant
prisma/
  schema.prisma     # única fonte de verdade do schema do banco do portal
  migrations/
docs/
  adr/              # Architecture Decision Records
  guidelines/       # guias de desenvolvimento
  templates/
.claude/
  agents/           # definições de agentes especializados
  skills/           # skills (workflows multi-passo)
```

---

## Convenções

### Nomenclatura de Arquivos e Símbolos
- **Arquivos:** `kebab-case.tsx` — ex: `conta-form.tsx`, `use-fiscal.ts`
- **Componentes React:** `PascalCase` — ex: `ContaForm`, `PortalShell`
- **Hooks:** `useCamelCase` — ex: `useFiscalResumo`
- **Variáveis/funções:** `camelCase`
- **Constantes:** `SCREAMING_SNAKE_CASE`

### Server vs Client Components
- **Server Component por padrão** — nunca adicione `'use client'` sem necessidade.
- Use `'use client'` apenas quando o componente usa estado, efeitos, event handlers ou hooks de browser.
- Prefira um Client Component pequeno e isolado dentro do módulo, mantendo a `page.tsx` como Server Component fino.

### Importações Entre Módulos
```ts
// CORRETO — importar somente do index.ts público
import { FiscalResumo } from '@/modules/fiscal'

// ERRADO — importar internos de outro módulo
import { FiscalResumo } from '@/modules/fiscal/components/fiscal-resumo'
```

### Dois Backends de Dados — Qual Usar
- **Conta, sessão, catálogo da Carta de Serviços, solicitações do próprio portal** → Prisma (`shared/lib/prisma.ts`), repositórios em `shared/catalogo/*` e `modules/*/services` que usam `PrismaClient` — nunca `pg` cru.
- **Débitos, guias, NFS-e, DMS, certidões, parcelamento, caixa postal, protocolo/GED** → sempre via `shared/adapters/{tributario,gpe2,ged}.adapter.ts`, chamados a partir de `route.ts`/Server Components, nunca do browser.

---

## Data Fetching (cliente)

- **Sempre React Query** — sem `fetch()` solto em componentes.
- Chaves de cache centralizadas por módulo (`<recurso>_KEYS` ou array literal estruturado).
- Mutations **sempre invalidam** as queries relacionadas no `onSuccess`.
- Toda chamada do browser passa por uma rota BFF (`src/app/api/<recurso>/route.ts`), nunca direto a um backend externo nem direto ao Postgres.

## Formulários

- **Sempre RHF + Zod** — sem `useState` manual de campo.
- Schema Zod único, compartilhado entre validação do form e tipagem do payload de API (reaproveitar o schema do `route.ts` quando aplicável).
- Usar componentes `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` do shadcn/ui.

## Multi-tenant

- Município é resolvido por subdomínio (`shared/lib/extract-subdomain.ts` + `shared/lib/tenant-map.ts`), igual ao `gpd-web-tributario-front`.
- Toda tabela do banco próprio do portal é escopada por `municipio` — nunca uma query sem esse filtro.
- Toda chamada a backend externo propaga o município resolvido (header/subdomínio conforme o adapter) — nunca confiar em município vindo do body do client.

---

## Agentes Disponíveis (`.claude/agents/`)

| Agente | Quando acionar |
|--------|----------------|
| `feature-architect` | Criar novo módulo de negócio |
| `ui-builder` | Criar/modificar componentes e telas |
| `form-builder` | Adicionar formulários |
| `data-fetching` | Criar queries e mutations no cliente |
| `data-modeler` | Alterar o schema Prisma do banco próprio do portal |
| `backend-adapter` | Adicionar/alterar chamada a um backend externo (tributário, GED, gpe2) |
| `accessibility-reviewer` | Revisar acessibilidade antes de merge |
| `reuse-auditor` | Auditar duplicação antes de criar algo novo |

## Skills Disponíveis (`.claude/skills/`)

| Skill | O que faz |
|-------|-----------|
| `create-feature` | Scaffold completo de novo módulo |
| `add-page` | Adicionar página no App Router |
| `add-form` | Criar formulário RHF + Zod |
| `add-data-query` | Criar query/mutation React Query |
| `add-shadcn-component` | Adicionar e tematizar componente shadcn/ui |
| `add-prisma-model` | Adicionar/alterar model Prisma + migration |
| `add-adapter-call` | Adicionar chamada a um backend externo via adapter |

## Guidelines (`docs/guidelines/`)

- `data-model.md` — os dois mundos de dados (Prisma próprio vs. adapters externos)
- `multitenancy.md` — como o município é identificado e propagado
- `auth.md` — sessão do cidadão (documento+senha/OTP) e sessão do admin
- `forms-and-validation.md` — RHF + Zod
- `data-fetching.md` — React Query
- `naming.md` — convenções de nomenclatura

---

## Como Rodar

```bash
# Banco local
docker compose up -d

# Migrations
npx prisma migrate dev

# Desenvolvimento
npm run dev

# Testes
npm test

# Build de produção
npm run build
```
