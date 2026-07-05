# Parecer — Protocolo do gpe2 × Processo do GED: dá para coexistir?

> Dúvida do Joel: "implementamos protocolo no gpe2; quando é protocolo do gpe e
> quando do GED? solicitação é diferente de protocolo? dá pros dois viverem juntos?"
> **Resposta curta: SIM, coexistem — são complementares, não duplicatas.**

---

## 1. Solicitação ≠ Protocolo

- **Solicitação** (portal) = o **pedido do cidadão** (a porta de entrada).
- **Protocolo / Processo** = o **registro formal numerado** que aquele pedido
  gera num back-office e que **tramita**.

Uma solicitação do portal **gera** um protocolo/processo. O portal é a porta;
o protocolo é o número que nasce dela.

---

## 2. O que cada sistema é (núcleo)

### GED (GPEDocs) — especialista em DOCUMENTO + ASSINATURA
- Núcleo: `Documento`, `Pasta`, **`Assinatura`, `Certificado`, `TipoDocumental`**,
  `Metadado`, `Tag`, busca documental, compartilhamento. É um **GED** de verdade
  (gestão eletrônica de documentos + assinatura ICP-Brasil).
- Tem `Processo` (numero_protocolo, requerente_cpf/nome, tramitação por
  etapas/setores) + Memorandos/Ofícios. O `AbrirProcessoDoPortalService` (Lei
  13.460) cria um processo a partir da solicitação e entrega **decisão assinada**.
- **Foco:** processos cujo produto é **documento assinado** (ofício, decisão,
  certidão), guarda e assinatura documental.

### gpe2 — PROTOCOLO / PAE geral integrado ao ERP
- `prot_tipo`, `prot_assunto` (com **`permite_externo`** = cidadão pode abrir,
  `departamento_centralizador` = roteamento), `prot_assunto_campo` (**formulário
  dinâmico por assunto**), `prot_protocolo` (numero/ano, `is_externo`,
  **`origem_tipo`/`origem_id` polimórfico**, `departamento_atual`, situação,
  **SLA, apensamento**, `campos_valores`).
- **Foco:** o **protocolo geral da prefeitura** — tramitação entre **departamentos**,
  com SLA/apensamento, recebendo de **qualquer módulo interno do ERP** (compras,
  RH, contratos, via `origem_*` polimórfico) **e** do cidadão (`is_externo`).

### Onde se sobrepõem
Só numa casca: **"o cidadão abre um pedido que vira processo"**. Ambos sabem
fazer isso. Mas o **miolo** é diferente: GED = documento/assinatura; gpe2 =
protocolo/tramitação administrativa integrada ao ERP.

---

## 3. Como coexistem — 3 modelos

### Modelo A — Camadas (gpe2 tramita, GED guarda/assina) — *recomendado*
- **gpe2 = o protocolo/PAE** (o número oficial, o trâmite entre setores, SLA).
- **GED = a camada documental** (os documentos do processo, decisões assinadas).
- O gpe2 usa o GED como **repositório + assinatura** dos documentos do protocolo
  (via `origem_*` apontando pro GED, ou uma chamada de serviço).
- **Portal → gpe2** para o requerimento do cidadão (o gpe2 tem `permite_externo`).
- Vantagem: uma fonte de verdade do **protocolo** (gpe2), uma do **documento**
  (GED). Sem duplicar trâmite.

### Modelo B — Roteamento por serviço (os dois recebem do cidadão)
- Cada serviço da Carta declara o **destino** (`tipo_fluxo`):
  - `processo_ged` → serviços **documentais / com decisão assinada** (GED).
  - `protocolo_gpe2` → serviços de **tramitação administrativa** entre
    departamentos, com SLA/formulário dinâmico (gpe2).
- O **portal é o unificador**: o cidadão sempre vê "abrir solicitação"; o portal
  roteia nos bastidores. Ele **não precisa saber** se foi pro gpe2 ou GED.
- Vantagem: usa a força de cada um por tipo de serviço. Custo: classificar cada
  serviço e manter dois integradores.

### Modelo C — GED só cidadão, gpe2 só interno
- Portal sempre → GED (Lei 13.460). gpe2 protocolo só recebe dos **módulos
  internos** do ERP (não do portal). Simples, mas **desperdiça** o `permite_externo`
  do gpe2 e mantém dois PAEs paralelos.

---

## 4. Recomendação

**O portal já é o unificador** (o cidadão vê "solicitação"; o `tipo_fluxo` roteia).
Isso torna o **Modelo B** barato de adotar hoje e o **Modelo A** a evolução natural:

1. **Curto prazo (Modelo B):** manter `processo_ged` e **acrescentar
   `protocolo_gpe2`** no catálogo. O portal roteia por serviço. Nada muda pro
   cidadão — ele só "abre uma solicitação".
2. **Evolução (Modelo A):** definir o **gpe2 como protocolo central** e o **GED
   como camada documental/assinatura** — o gpe2 chama o GED para guardar/assinar
   os documentos. Aí some qualquer duplicação de trâmite.

O que **não** recomendo: dois PAEs recebendo o cidadão **sem** o portal roteando
(aí sim vira confusão — dois números de protocolo pro mesmo pedido).

---

## 5. Decisões a confirmar com Gabriel/Vitor

1. **Qual sistema é o protocolo/PAE do cidadão** por tipo de serviço (Modelo B),
   ou o gpe2 é o central e o GED é a camada documental (Modelo A)?
2. O **gpe2 protocolo usa o GED** para os documentos/assinatura, ou guarda os
   próprios anexos (ele tem `documento_tramite_arquivo`)?
3. Se Modelo B: a **classificação de cada serviço** da Carta (documental → GED;
   administrativo → gpe2).

---

## 6. Impacto no portal (o que já está pronto)

O portal já registra a solicitação (`portal_solicitacoes`) e o "abrir processo" é
um TODO agnóstico. Adotar qualquer modelo é **só apontar o adapter** para o
sistema certo (gpe2 e/ou GED), com base no `tipo_fluxo` do serviço. Zero retrabalho
no que foi feito. Ambos precisam expor uma **API** (o GED ainda não tem; o gpe2 tem
`ProtocoloApiController`) e o contrato de **auth/tenant** (ver a conversa com o Vitor).
