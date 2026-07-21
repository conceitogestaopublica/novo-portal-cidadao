---
name: create-feature
description: Adicionar um novo módulo de negócio do zero com estrutura isolada, index.ts público e rotas no App Router.
---

# Skill: create-feature

## Pré-requisitos

- Nome do módulo definido (ex: `ouvidoria`, `transparencia`)
- Mundo de dados identificado: banco próprio (Prisma) e/ou backend externo (adapter)
- Páginas iniciais mapeadas: pública (`(portal)`) e/ou admin (`(admin)`)

## Passos

### 1. Criar estrutura de diretórios

```bash
mkdir -p src/modules/<nome>/{components,hooks,services,schemas,types}
```

### 2. Criar schemas Zod

`src/modules/<nome>/schemas/<nome>.schema.ts`

```typescript
import { z } from 'zod'

export const <nome>Schema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, 'Nome obrigatório'),
})

export type <Nome> = z.infer<typeof <nome>Schema>
```

### 3. Criar a rota BFF

`src/app/api/<recurso>/route.ts` — decide o mundo de dados:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma"; // se for dado do próprio portal
// OU: import { algumaChamada } from "@/shared/adapters/tributario.adapter"; // se externo

export async function GET() {
  const dados = await prisma.<model>.findMany();
  return NextResponse.json(dados);
}
```

### 4. Criar funções de serviço (client-side, via BFF)

`src/modules/<nome>/services/<nome>.service.ts`

```typescript
import { requestJsonOrError } from "@/shared/lib/client-api";
import type { <Nome> } from "../schemas/<nome>.schema";

export function fetch<Nome>List() {
  return requestJsonOrError<<Nome>[]>(`/api/<recurso>`, { method: "GET" });
}
```

### 5. Criar hooks React Query

`src/modules/<nome>/hooks/use-<nome>.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetch<Nome>List } from '../services/<nome>.service'

export function use<Nome>List() {
  return useQuery({
    queryKey: ['<recurso>', 'list'],
    queryFn: fetch<Nome>List,
  })
}
```

### 6. Criar componentes iniciais

`src/modules/<nome>/components/<nome>-list.tsx`

```typescript
// Server Component por padrão (sem 'use client')
import type { <Nome> } from '../schemas/<nome>.schema'

interface <Nome>ListProps {
  items: <Nome>[]
}

export function <Nome>List({ items }: <Nome>ListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
  }
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="p-4 bg-card border border-border rounded-lg">
          {item.nome}
        </div>
      ))}
    </div>
  )
}
```

### 7. Criar rotas no App Router

`src/app/(portal)/<nome>/page.tsx` (pública/autenticada do cidadão) ou
`src/app/(admin)/admin/<nome>/page.tsx` (console admin):

```typescript
import { <Nome>List } from '@/modules/<nome>'

export default function <Nome>Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground">Título</h1>
      {/* Dados via React Query em um Client Component filho */}
    </div>
  )
}
```

### 8. Criar index.ts público

`src/modules/<nome>/index.ts`

```typescript
export { <Nome>List } from './components/<nome>-list'
export { use<Nome>List } from './hooks/use-<nome>'
export type { <Nome> } from './schemas/<nome>.schema'
```

### 9. Criar ADR (se módulo significativo)

`docs/adr/00XX-modulo-<nome>.md`

## Checklist

- [ ] Estrutura de diretórios criada: `components/`, `hooks/`, `services/`, `schemas/`, `types/`
- [ ] Schemas Zod definidos com tipos inferidos
- [ ] Rota BFF criada, com o mundo de dados correto (Prisma vs. adapter externo)
- [ ] Funções de serviço usando `requestJsonOrError`
- [ ] Hooks React Query criados (sem fetch direto)
- [ ] Componentes são Server Components por padrão
- [ ] Nenhum HEX solto — somente tokens de tema shadcn
- [ ] Rota criada em `(portal)` ou `(admin)` conforme o público
- [ ] `index.ts` com exports explícitos (sem `export *`)
- [ ] Nenhum import de internos de outro módulo
- [ ] ADR criado se módulo significativo
