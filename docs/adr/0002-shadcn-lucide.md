# ADR-0002: shadcn/ui + lucide-react, remoção do Font Awesome

## Status

`Aceito`

## Contexto

A UI usava Tailwind cru sem design system e ícones via classes Font Awesome
(`<i className="fas fa-...">`), carregados de um CDN externo
(`cdnjs.cloudflare.com`) referenciado no `<head>` do layout raiz — uma
dependência de rede externa não versionada, sem tree-shaking, divergente do
padrão do `gpd-web-tributario-front` (shadcn/ui + `lucide-react`, sem CDN).

## Decisão

**shadcn/ui (style `base-nova`, `baseColor: "neutral"`) + `lucide-react`**,
exatamente o mesmo preset do front de referência. Font Awesome removido por
completo (CDN e toda classe `fas fa-*` usada como ícone JSX).

O catálogo (ambientes/categorias/serviços) guarda o ícone como string legada
(`"fas fa-hand-holding-dollar"`) em JSONB — migrar esse dado exigiria uma
migration de conteúdo em produção sem ganho real. Em vez disso, um resolver
central (`shared/lib/icon-registry.tsx`, `<CatalogoIcon nome={...} />`) mapeia
a string legada para um componente `lucide-react` equivalente, com fallback
genérico para nome não mapeado. O dado permanece intacto; só a renderização
mudou.

## Consequências

**Positivas:**
- Zero dependência de CDN externo para ícones.
- Design system consistente com o projeto irmão (mesmo preset shadcn).
- Dado do catálogo já seedado em produção continua válido sem migration.

**Negativas / trade-offs:**
- O mapeamento FA→lucide em `icon-registry.tsx` precisa ser estendido
  manualmente sempre que um ícone novo (string FA nunca vista) aparecer no
  catálogo — cai no fallback genérico até alguém mapear.
- `--primary` deste preset (`baseColor: "neutral"`) é tons de cinza, não a cor
  de marca azul do portal — os CTAs continuam em `bg-blue-*` literal (ver
  ADR de tokens de tema, quando houver), não em `bg-primary`.

## Alternativas Consideradas

- **Migrar o dado do catálogo para nomes de ícone lucide diretamente:**
  descartado — exigiria migration de conteúdo em produção (municípios já
  seedados) sem benefício sobre o resolver em runtime.
- **Manter Font Awesome, só remover o CDN (self-host):** descartado —
  divergiria do padrão do projeto irmão sem necessidade.

## Data

2026-07-21
