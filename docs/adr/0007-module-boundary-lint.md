# ADR-0007: Fronteira de módulo verificada por ferramenta (ESLint)

## Status

`Aceito`

## Contexto

A Regra de Ouro "um módulo nunca importa artefato interno de outro — só o
`index.ts` público" só existia como convenção documentada, sem nenhuma
ferramenta impedindo a violação — nem neste projeto, nem no
`gpd-web-tributario-front`, nem no backend (`eslint.config.mjs` dos dois usa
só `eslint-config-next`/`typescript-eslint` recomendado, sem regra de
boundary). Neste projeto especificamente, a extração de `services/`+`hooks/`
(ADR-0006) por pouco introduziu 4 imports do módulo `auth` para seus próprios
hooks via caminho absoluto (`@/modules/auth/hooks/...`) em vez do relativo
(`../hooks/...`) usado em todo o resto do código — inofensivo por ser
same-module, mas o tipo de deriva que a regra existe para pegar quando é
cross-module.

## Decisão

**`no-restricted-imports` no `eslint.config.mjs`**, bloqueando o padrão
`@/modules/*/{components,hooks,services}/*` em qualquer arquivo do projeto.
Import de fora de um módulo só pode vir do `index.ts` (`@/modules/<nome>`);
dentro do próprio módulo, import relativo (`../hooks/...`, `./...`).

**Schemas ficam de fora da regra, de propósito** — `@/modules/*/schemas/*` é
o contrato deliberadamente compartilhado entre o formulário do módulo e a
rota BFF que valida o mesmo shape (ver ADR-0004); múltiplas rotas em
`src/app/api/**` já importam schema direto do módulo, e isso é o padrão
correto, não uma violação.

Nenhuma dependência nova — `no-restricted-imports` já vem do ESLint core.

## Consequências

**Positivas:**
- Import indevido entre módulos agora quebra o lint, não só a revisão manual.
- Vai além do padrão dos dois projetos-irmãos (que documentam a regra sem
  ferramenta) — decisão deliberada deste projeto, não uma lacuna herdada.

**Negativas / trade-offs:**
- Um plugin dedicado (`eslint-plugin-boundaries`) daria mensagens mais ricas
  e suportaria grafos de dependência mais complexos — descartado por ora
  para não introduzir dependência nova sem necessidade comprovada; migrar
  para ele é trivial se `no-restricted-imports` se mostrar insuficiente.

## Alternativas Consideradas

- **`eslint-plugin-boundaries`:** mais expressivo, mas dependência nova para
  um caso de uso que `no-restricted-imports` já resolve — descartado por ora.
- **Só convenção documentada, sem ferramenta:** era o estado anterior (e o
  estado atual dos dois projetos-irmãos) — descartado porque já causou uma
  deriva real (os 4 imports do módulo `auth`) que passou despercebida até
  este ADR.

## Data

2026-07-21
