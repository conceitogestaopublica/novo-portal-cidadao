# Contrato — Portal do Cidadão × Protocolo do gpe2 (Modelo A)

> **Decisão:** Modelo A — o **gpe2 é o protocolo/PAE central**; o cidadão abre pelo
> portal e a solicitação vira **protocolo no gpe2**. (O GED fica como camada de
> documentos/assinatura, usada pelo gpe2.)
>
> **Boa notícia:** o gpe2 **já tem** o gateway pronto para o Tributário
> (`ProtocoloApiController` + `TributarioGatewayService`). Falta só o **irmão do
> portal** (mesmo padrão). Baixo risco — é copiar o que já existe.

---

## 1. O que o gpe2 já tem (referência)

- `POST /api/protocolo/tributario/abrir` — o Tributário abre protocolo
  (`origem_tipo='tributario'`), auth por `X-Protocolo-Token` validado por gestora
  (`tokenEntradaValido`), **idempotente** por (gestora, origem_tipo, origem_id),
  retorna `{ ok, protocolo_id, numero, novo }`.
- `GET /api/protocolo/{id}` — consulta situação + tramitação.
- `TributarioGatewayService.notificarSituacao()` — **webhook de saída**: o gpe2
  avisa o sistema cliente quando a situação muda (config por gestora em
  `tributario_config`: `token_entrada`, `token_enc`, url de notificação).

> **STATUS (2026-07-05): lado gpe2 IMPLEMENTADO + E2E VERIFICADO** na branch
> `feature/protocolo-portal` (base `feature/rbac`), commit `11a361e`. Migrations
> aplicadas no banco do gpe2 e o loop completo testado ponta a ponta (ver §6).
> Falta só a revisão/publicação do Vitor.
>
> **E2E verificado (2026-07-05):** (1) `POST /api/protocolo/portal/abrir` — token
> errado → 401; token certo → 201 cria protocolo `origem_tipo=portal`+`origem_ref`,
> roteado ao `departamento_centralizador` do assunto; repetir mesma `origem_ref` →
> `novo:false` (idempotente). (2) Encerrar o protocolo no gpe2 → `notificarOrigem`
> → `PortalGatewayService` posta em `POST {url_base}/api/webhooks/protocolo` → a
> solicitação no portal foi de `ABERTA` para `CONCLUIDA` com `protocolo_numero` e
> `protocolo_sistema=gpe2`. (Dados de teste removidos após verificar.)

## 2. O que falta no gpe2 (o que peço ao time do gpe2) — ✅ FEITO

### 2.1 Endpoint `POST /api/protocolo/portal/abrir`

Espelho do `abrirDoTributario`, com `origem_tipo='portal'` e origem por **string**
(o portal não tem id inteiro; usa o protocolo da solicitação como referência).

**Auth:** `X-Protocolo-Token: <token de entrada da gestora>` (mesmo
`tokenEntradaValido`, mas para a config do portal — ver 2.2).

**Payload (o portal envia):**
```json
{
  "gestora_id": 123,
  "origem_ref": "SOL20260705-6219",   // protocolo da solicitação no portal (idempotência)
  "descricao": "Abrir requerimento / protocolo — <mensagem do cidadão>",
  "solicitante_doc": "01550999000105",
  "solicitante_nome": "Fulano de Tal",
  "assunto_id": null                    // opcional; se null, usa o assunto padrão da gestora
}
```

**Regras:**
- Idempotência por (`gestora_id`, `origem_tipo='portal'`, `origem_ref`).
- Abre com `is_externo=1`, `solicitante_doc/nome`, `assunto_id` (ou padrão), e
  roteia pelo `departamento_centralizador` do assunto.

**Resposta:**
```json
{ "ok": true, "protocolo_id": 456, "numero": "123/2026", "novo": true }
```

### 2.2 Config do portal por gestora

Como o `tributario_config`, mas para o portal (pode ser uma linha nova numa tabela
`portal_config`/`sistema_integrado_config` por gestora):
- `token_entrada` — o token que o portal manda no `X-Protocolo-Token`.
- `assunto_id` padrão para protocolos abertos pelo portal (fallback).
- url + token de **notificação de saída** (webhook) para o portal (ver 2.3).

### 2.3 Webhook de status → portal (**o portal já está pronto**)

O portal **já expõe** `POST /api/webhooks/protocolo` (autenticado por
`X-Protocolo-Token` = token da gestora; resolve o município pelo host). Falta só o
gpe2 **chamá-lo** no `notificarSituacao`, com:
```
POST <portal>/api/webhooks/protocolo     (header X-Protocolo-Token: <token da gestora>)
{ "origem_ref": "SOL...-6219", "protocolo_id": 456, "numero": "123/2026", "situacao": "tramitando" }
```
O portal mapeia a situação (`aberto`→ABERTA, `tramitando`→EM_ANDAMENTO,
`deferido`/`indeferido`→CONCLUIDA, `arquivado`→CANCELADA) e atualiza a solicitação.
Verificado e2e (token errado → 401; correto → 200 e o cidadão vê a nova situação).

---

## 3. O que o portal já faz (pronto do lado de cá)

- `gpe2.adapter.ts`: `abrirProtocoloGpe2()` (POST acima) + `consultarProtocoloGpe2()`.
- Ao abrir uma solicitação (`POST /api/solicitacoes`): se a gestora tiver
  `gpe2GestoraId` + `gpe2ProtocoloToken` + `baseUrls.gpe2` no `tenant-map`
  (`PORTAL_TENANTS`), o portal **abre o protocolo no gpe2** e guarda
  `protocolo_id`/`protocolo_numero` na solicitação. Sem config → fica só registrado
  (degrada). Zero acoplamento — é só preencher a config por município.
- Falta no portal (quando o webhook 2.3 existir): a rota
  `POST /api/webhooks/protocolo` para receber a situação e atualizar a solicitação.

---

## 4. Config a preencher (por município), no `PORTAL_TENANTS`

```json
{
  "santoantonio": {
    "municipio": "santoantonio", "nome": "...", "tributarioSubdomain": "santoantonio",
    "gpe2GestoraId": 123,
    "gpe2ProtocoloToken": "<token_entrada da gestora no gpe2>",
    "baseUrls": { "tributario": "...", "gpe2": "https://gpe2.santoantonio.gov.br" }
  }
}
```
(Em dev: `DEV_GPE2_GESTORA_ID` e `DEV_GPE2_PROTOCOLO_TOKEN`.)

---

## 5. Modelo A — a outra metade (gpe2 ↔ GED)

O "gpe2 usa o GED para documentos/assinatura" é uma integração **gpe2↔GED**
(back-office), **fora do portal**. O portal só precisa do item 2 acima para que a
solicitação do cidadão vire protocolo. A ligação com o GED para anexar/assinar
documentos do protocolo é decisão/implementação dos times do gpe2 e do GED.

---

## 6. Como testar/ativar no gpe2 (para o Vitor)

Branch `feature/protocolo-portal` (base `feature/rbac`). Arquivos:
`ProtocoloApiController@abrirDoPortal`, `PortalGatewayService`,
`ProtocoloService` (origem_ref + `notificarOrigem`), migrations
`2026_07_05_000100_add_origem_ref_protocolo` e `2026_07_05_000200_create_portal_config_table`
(espelhadas em `database/migrations/mariadb/`), rota `api/protocolo/portal/abrir`,
isenção CSRF `api/protocolo/*` em `bootstrap/app.php`.

1. **Migrar:** `php artisan migrate` (cria `portal_config` + coluna `origem_ref`).
2. **Configurar a gestora** (uma linha por município):
   ```sql
   INSERT INTO portal_config (gestora_id, url_base, token_entrada, ativo, assunto_id, created_at, updated_at)
   VALUES (1, 'http://localhost:3005', 'dev-protocolo-token-abc123', 1, <ID_DE_UM_prot_assunto_permite_externo>, now(), now());
   ```
   (`assunto_id` = um `prot_assunto` com `permite_externo`; `url_base` = base do portal
   para o webhook de saída; `token_entrada` = o mesmo `DEV_GPE2_PROTOCOLO_TOKEN` do portal.)
3. **Abrir (portal→gpe2):**
   ```bash
   curl -X POST http://localhost:8000/api/protocolo/portal/abrir \
     -H "Content-Type: application/json" -H "X-Protocolo-Token: dev-protocolo-token-abc123" \
     -d '{"gestora_id":1,"origem_ref":"SOL20260705-6219","descricao":"Teste portal","solicitante_doc":"01550999000105","solicitante_nome":"Fulano"}'
   # → {"ok":true,"protocolo_id":N,"numero":"N/2026","novo":true}   (repetir = novo:false, idempotente)
   ```
4. **Saída (gpe2→portal):** encaminhe/encerre o protocolo no gpe2 → o
   `PortalGatewayService` posta em `POST {url_base}/api/webhooks/protocolo` e o cidadão
   vê a nova situação em "Minhas solicitações".

**Nota de comportamento:** `encaminhar()` passou a notificar a origem também na
tramitação (situação `tramitando`) — antes o Tributário só era avisado no
encerramento; agora recebe `tramitando` também (aditivo, best-effort).

**Follow-ups:** teste de feature (o projeto ainda não tem testes de protocolo; o
`phpunit.xml` usa um DB de teste mysql).
