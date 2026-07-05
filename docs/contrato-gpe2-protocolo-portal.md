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

## 2. O que falta no gpe2 (o que peço ao time do gpe2)

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

### 2.3 Webhook de status → portal (opcional, fase 2)

Estender o `notificarSituacao` para também notificar o **portal** quando a situação
do protocolo mudar, chamando:
```
POST <portal>/api/webhooks/protocolo
{ "origem_ref": "SOL...-6219", "protocolo_id": 456, "numero": "123/2026", "situacao": "tramitando" }
```
Assim o cidadão vê a situação atualizada em "Minhas Solicitações".

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
