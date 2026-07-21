---
name: add-page
description: Adicionar uma página no App Router reutilizando o shell da área do cidadão ou do admin.
---

# Skill: add-page

## Passos

### 1. Decidir o local da rota

- **Área do cidadão (pública ou autenticada):** `src/app/(portal)/<rota>/page.tsx` — herda o shell (`PortalShell`, de `@/modules/portal`) do `src/app/(portal)/layout.tsx`.
- **Console admin da Carta de Serviços:** `src/app/(admin)/admin/<rota>/page.tsx` — protegido por `requireAdmin()` (`shared/lib/admin-session.ts`), chamado no layout ou no topo da página.
- **API Route Handler (BFF):** `src/app/api/<rota>/route.ts` — chama `prisma` direto (dado do próprio portal) ou um adapter em `shared/adapters/*` (dado externo), nunca as duas coisas misturadas na mesma função.

### 2. Criar o arquivo `page.tsx`

**Server Component por padrão (sem `'use client'`):**

```typescript
// src/app/(portal)/<rota>/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Título da Página | Portal do Cidadão',
}

export default function <Nome>Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground">Título</h1>
      {/* Conteúdo */}
    </div>
  )
}
```

### 2.1. Guard de sessão (se a página exige o cidadão autenticado)

Diferente do ERP irmão (que usa RBAC por permissão granular), este projeto tem duas
sessões simples: a do cidadão (`shared/lib/portal-session.ts`) e a do admin
(`shared/lib/admin-session.ts`). Chame o guard correspondente **no servidor**, no
topo da página — nunca confie só na UI do client para proteger a tela:

```typescript
// página do cidadão autenticado
import { requireCidadao } from "@/shared/lib/portal-session";

export default async function MinhasSolicitacoesPage() {
  const cidadao = await requireCidadao(); // redireciona para /entrar se não houver sessão
  return <MinhasSolicitacoesClient cidadao={cidadao} />;
}
```

```typescript
// página do admin
import { requireAdmin } from "@/shared/lib/admin-session";

export default async function AdminPage() {
  await requireAdmin(); // redireciona para /admin/entrar se não houver sessão
  return <AdminConsole />;
}
```

### 3. Carregar dados

**Opção A — Client Component que faz a query (mais simples, padrão neste projeto):**

```typescript
// page.tsx (Server Component)
import { <Nome>Content } from '@/modules/<nome>/components/<nome>-content'
export default function Page() {
  return <<Nome>Content />
}

// <nome>-content.tsx (Client Component)
'use client'
import { use<Nome>List } from '@/modules/<nome>'

export function <Nome>Content() {
  const { data, isLoading, isError } = use<Nome>List()
  if (isLoading) return <p>Carregando...</p>
  if (isError) return <p role="alert">Não foi possível carregar.</p>
  return <<Nome>List items={data ?? []} />
}
```

**Opção B — Prefetch server-side (quando SEO/first paint importa, ex.: vitrine pública da Carta de Serviços):**

```typescript
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { fetch<Nome>List } from '@/modules/<nome>/services/<nome>.service'

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['<recurso>', 'list'],
    queryFn: () => fetch<Nome>List(),
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <<Nome>Content />
    </HydrationBoundary>
  )
}
```

### 4. Reutilizar o shell existente

`src/app/(portal)/layout.tsx` já inclui o `PortalShell` (header, busca, navegação
"Meus Débitos"/"Minhas Solicitações"). `src/app/(admin)/layout.tsx` inclui o shell do
admin. **Não criar novo layout** a menos que a página precise de estrutura
radicalmente diferente.

### 5. Tratar estados obrigatórios

Toda página que carrega dados deve tratar loading/erro/vazio — usar `Skeleton` do
shadcn/ui para loading, e um estado de erro com `role="alert"` e ação de "tentar
novamente" via `refetch()`.

## Checklist

- [ ] Arquivo criado em `src/app/(portal)/<rota>/` ou `src/app/(admin)/admin/<rota>/`
- [ ] Server Component por padrão — `'use client'` justificado se usado
- [ ] Guard de sessão (`requireCidadao`/`requireAdmin`) chamado no servidor se a página exige login
- [ ] Metadata da página definida (`title`)
- [ ] Layout/shell reutilizado — sem novo layout desnecessário
- [ ] Estados loading/erro/vazio tratados
- [ ] Rota testada no browser com `npm run dev`
