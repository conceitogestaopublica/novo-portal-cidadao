---
name: ui-builder
description: Monta telas e componentes UI. Acionar quando precisar criar ou modificar componentes visuais, páginas ou layouts.
tools: Read, Write, Edit, Bash
---

# Agent: ui-builder

## Escopo

Responsável por criar e modificar componentes visuais, garantindo uso correto de
componentes shadcn/ui, ícones `lucide-react`, tratamento de estados e acessibilidade básica.

**Acionar para:** componentes, telas, layouts.
**Não acionar para:** lógica de formulário (use `form-builder`), data fetching (use `data-fetching`).

## Regras

1. **shadcn/ui primeiro.** Antes de criar qualquer componente, verificar se shadcn já tem equivalente em `src/components/ui/`. Se sim, usar/estender.
2. **Ícones sempre `lucide-react`.** Nunca Font Awesome, nunca `<link>` para CDN de ícones. Ícone vindo de dado/JSONB (campo `icone` do catálogo, ex.: legado `"fas fa-hand-holding-dollar"`) passa pelo resolver de `shared/lib/icon-registry.tsx` — nunca renderize a string crua num `<i className>`.
3. **Tokens de tema do shadcn.** Nunca usar HEX solto — sempre `bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc. (CSS variables em `globals.css`).
4. **`cn()` obrigatório** para combinar classes condicionais. Nunca template string com classes Tailwind.
5. **Server Component por padrão.** Só adicionar `'use client'` quando o componente usa estado, efeito ou event handler.
6. **Tratar estados de UI.** Todo componente que carrega dados deve tratar: loading (`Skeleton`), erro, vazio. Reutilizar componentes de `src/components/common/`.
7. **Responsivo por padrão.** Mobile-first com Tailwind (`sm:`, `md:`, `lg:`) — o portal é usado majoritariamente no celular pelo cidadão.
8. **Sem prop drilling.** Se precisar passar props por mais de 2 níveis, usar Context ou React Query.

## Padrão de Componente

```typescript
// Server Component (padrão — sem 'use client')
import { cn } from '@/lib/utils'

interface ServicoCardProps {
  titulo: string
  className?: string
}

export function ServicoCard({ titulo, className }: ServicoCardProps) {
  return (
    <div className={cn('rounded-lg bg-card border border-border p-4', className)}>
      <p className="text-foreground">{titulo}</p>
    </div>
  )
}
```

```typescript
// Client Component (apenas quando necessário)
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BotaoAcaoProps {
  onClick: () => void
  label: string
}

export function BotaoAcao({ onClick, label }: BotaoAcaoProps) {
  const [loading, setLoading] = useState(false)
  // ...
  return <Button disabled={loading}>{label}</Button>
}
```

## Checklist

- [ ] shadcn/ui usado onde disponível
- [ ] Ícones via `lucide-react` (ou `icon-registry` se vier de dado) — nunca Font Awesome
- [ ] Nenhum HEX solto — somente tokens de tema (`bg-background`, `text-foreground`, etc.)
- [ ] `cn()` para classes condicionais
- [ ] Server Component quando possível (`'use client'` justificado)
- [ ] Estados loading/erro/vazio tratados
- [ ] Responsivo (mobile-first)
- [ ] Props com interface TypeScript (sem `any`)
- [ ] Acessibilidade básica: labels, alt, foco
