# ADR-0003: Camada de fetch centralizada (http-client / client-api)

## Status

`Aceito`

## Contexto

Seis páginas fiscais (`fiscal-dms.tsx`, `fiscal-nfse.tsx`, etc.) duplicavam,
quase textualmente, os mesmos três helpers locais (`getJson`/`send`/`motivo`)
para chamar as rotas BFF, incluindo a mesma lógica de colher mensagem de erro
de validação por campo (422) e um sentinel de string (`throw new
Error("SESSAO")`) para sinalizar sessão expirada. `AdminConsole.tsx` e a busca
de serviços tinham variações do mesmo padrão.

## Decisão

**`shared/lib/http-client.ts` (`ApiError`, `isSessaoExpirada`) +
`shared/lib/client-api.ts` (`requestJsonOrError`, `requestNoContentOrError`,
`postJson`)**, nos mesmos moldes do `gpd-web-tributario-front`. `ApiError`
carrega `status` como número — a checagem de sessão expirada vira
`isSessaoExpirada(err)` (`err.status === 401`), não mais comparação de string.

## Consequências

**Positivas:**
- Uma única implementação de "colher erro de validação por campo" para todo o
  projeto, em vez de 6+ cópias divergentes.
- `ApiError.status` tipado permite tratar 401/404/409/422 por código, não por
  string mágica.

**Negativas / trade-offs:**
- Nenhuma identificada — é estritamente uma extração de duplicação, sem novo
  comportamento.

## Alternativas Consideradas

- **axios:** o front de referência já testou e removeu (não propagava tenant
  corretamente) — descartado por consistência com essa decisão já tomada lá.

## Data

2026-07-21
