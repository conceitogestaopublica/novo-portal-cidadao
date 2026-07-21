# ADR-0004: React Hook Form + Zod em todo formulário

## Status

`Aceito`

## Contexto

Os 8 formulários do portal (cadastro, entrar, recuperar, redefinir, abrir
solicitação, responder solicitação, CRUD de admin) validavam campo a campo
manualmente com `useState`, duplicando regras que já existiam como `z.object`
nas rotas BFF (`route.ts`) — a mesma regra ("senha mín. 6 caracteres",
"informe o nome") escrita duas vezes, uma em português solto no componente e
outra no Zod do servidor, sem garantia de ficarem em sincronia.

## Decisão

**React Hook Form + `@hookform/resolvers/zod`**, com o schema Zod do
`route.ts` extraído para `modules/<nome>/schemas/*.schema.ts` e importado
tanto pelo formulário quanto pela rota — validação compartilhada, não
duplicada. Campos usam `register()` + `Input`/`Label` do shadcn (o style
`base-nova` não tem os componentes `Form`/`FormField` de outros styles do
shadcn — ver `docs/guidelines/forms-and-validation.md`).

Schemas com `.default()` usam o split `z.input`/`z.output` do Zod: o tipo de
entrada (campos com default ficam opcionais) para `useForm`/`defaultValues`,
o tipo de saída (defaults aplicados) para o que `handleSubmit` entrega —
`useForm<Input, unknown, Output>()`, a terceira generic do React Hook Form v7
para valores transformados pelo resolver.

## Consequências

**Positivas:**
- Uma única fonte de verdade por regra de validação (client + servidor).
- Estado de formulário, erro por campo e loading (`isSubmitting`/`isPending`)
  vêm de graça do RHF, sem `useState` manual repetido em cada tela.

**Negativas / trade-offs:**
- **Achado real:** o `Button` do shadcn (`base-nova`/`@base-ui/react`) não
  herda o default nativo do HTML (`<button>` sem `type` dentro de um form já
  é `submit`) — ele renderiza `type="button"` por padrão. Sem `type="submit"`
  explícito, o clique não dispara `handleSubmit` (só Enter no input
  funciona), e isso não aparece em typecheck, lint nem smoke test via
  `curl` — só um teste de componente simulando o clique pega. Foi um bug real
  nesta migração, corrigido em 8 botões e documentado como regra obrigatória
  em `.claude/agents/form-builder.md`/`.claude/skills/add-form/SKILL.md`.

## Alternativas Consideradas

- **Formik:** RHF tem menos re-renders e já é o padrão do front de
  referência — descartado por consistência.
- **Validação só no servidor, sem Zod no client:** descartado — perderia
  feedback instantâneo de campo (ex.: senhas não conferem) sem round-trip.

## Data

2026-07-21
