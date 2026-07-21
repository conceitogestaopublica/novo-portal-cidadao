---
name: add-shadcn-component
description: Adicionar componente shadcn/ui ao projeto, garantindo que use os tokens de tema e suporte dark mode.
---

# Skill: add-shadcn-component

## Passos

### 1. Verificar se já foi adicionado

```bash
ls src/components/ui/
```

### 2. Adicionar via CLI

```bash
npx shadcn@latest add <componente>
```

Componentes usados neste projeto: `button`, `input`, `form`, `card`, `badge`,
`skeleton`, `dialog`, `select`, `label`, `separator`, `sonner`.

O componente será gerado em `src/components/ui/<componente>.tsx`.

### 3. Revisar o arquivo gerado

- Usa CSS variables? (`bg-background`, `text-foreground`, `border-border`, etc.) ✓
- Usa HEX solto? (`#ffffff`, `rgb(...)`) ✗ — corrigir para usar variável.

### 4. Ícones vindos de dado (catálogo)

O campo `icone` do catálogo (`portal_ambientes`/`portal_categorias`/`portal_servicos`)
guarda uma string legada (ex.: `"fas fa-hand-holding-dollar"`), herdada do portal do
GED. Para renderizar, **não** crie um `<i className={icone}>` — use o resolver:

```typescript
import { CatalogoIcon } from '@/shared/lib/icon-registry'

<CatalogoIcon nome={servico.icone} className="text-primary" />
```

`CatalogoIcon` mapeia a string legada para um componente `lucide-react` equivalente.
Se o ícone não estiver mapeado, ele cai num ícone genérico (`FileText`) — adicionar o
mapeamento em `shared/lib/icon-registry.tsx` em vez de inventar outra forma de renderizar.

### 5. Testar o componente

```bash
npm run dev
```

Verificar visualmente: light mode, dark mode e responsivo (mobile é o uso principal deste portal).

## Checklist

- [ ] Componente adicionado via `npx shadcn@latest add`
- [ ] Sem HEX solto — usa CSS variables do tema
- [ ] Compatível com dark mode
- [ ] Ícone de dado (catálogo) resolvido via `CatalogoIcon`/`icon-registry`, nunca `<i className>` cru
- [ ] Acessível — labels, roles, foco presentes
- [ ] Testado visualmente em mobile, light e dark mode
