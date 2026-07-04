# Manual do Usuário — Portal do Cidadão

> Documento vivo. Cada rotina nova do portal é registrada aqui.

---

## 1. Atendimento ao Contribuinte — Uma conta, várias empresas ("Atuar como")

### 1.1 Para que serve

No **Atendimento ao Contribuinte** você usa **um login só** (o seu CPF) e, dentro
dele, **alterna entre você mesmo e as empresas que você representa** — sem precisar
sair e entrar de novo com outro documento. É o modelo "atuar como": comum para
**contadores** e responsáveis que cuidam de várias empresas.

Hoje o portal reconhece automaticamente as empresas em que você consta como
**contador** no cadastro do município. (Quando a prefeitura passar a registrar
sócio/responsável legal, ou quando entrar o login gov.br, essas empresas aparecem
na mesma lista, sem nenhuma mudança para você.)

### 1.2 Como entrar

Você tem dois jeitos de acessar:

1. **Com senha** — se você já criou uma conta (documento + senha). Tela **Entrar**.
2. **Com código (acesso rápido)** — informe o CPF/CNPJ e receba um código de
   verificação no seu contato cadastrado; digite o código para entrar.
3. **Criar conta** — só quem é contribuinte do município pode se cadastrar; o
   documento é validado no cadastro oficial.

Em qualquer um dos três, ao entrar você já fica **atuando como você mesmo (o CPF)**.

### 1.3 Como alternar para uma empresa

Na página **Meus Débitos**, logo abaixo do título, aparece o painel **"Atuando como"**.

- Ele **só aparece se você representa ao menos uma empresa** (se você é só você, não
  há o que alternar e o painel fica oculto).
- Clique no cartão da **empresa** (ícone de prédio) para passar a atuar por ela.
  Clique no seu **nome** (ícone de pessoa) para voltar a ser você.
- Ao trocar, os cartões de resumo, as **guias** e a **caixa postal** recarregam
  automaticamente com os dados **da identidade escolhida**. O cartão ativo fica
  destacado com um ✓.

### 1.3-b Buscar uma guia (por número, ano ou origem)

Na seção **Minhas guias** há um campo de busca. Digite o **número** da guia
(ex.: `2026/000089`), o **ano**, ou a **origem** (IPTU, ISS…) para filtrar a lista
na hora. O contador ao lado mostra "encontradas/total".

### 1.3-c 2ª via de guia vencida = atualizar + emitir (mesmo serviço)

Se você pedir a **2ª via de uma guia vencida**, o boleto original está sem os
juros e a multa. O portal então abre uma janela onde você **informa o novo
vencimento** do boleto. Ao confirmar, ele **recalcula os juros e a multa até a
data escolhida**, reemite o boleto com o valor correto e abre a **2ª via já
atualizada** — tudo em uma ação. A guia passa a valer com o novo vencimento
informado e sai da situação "vencida". Se você fechar a janela, nada muda.

> A data precisa ser **hoje ou futura** (não é possível vencer no passado).

> Guias **pagas** ou **canceladas** não podem ser atualizadas/reemitidas.

### 1.4 O que você consegue fazer atuando como a empresa

Tudo do Atendimento passa a valer para a empresa selecionada:

- **Débitos em aberto** e **valor total**;
- **Minhas guias** e a **2ª via em PDF** (botão "2ª via" em cada guia);
- **Caixa Postal (DTE)** da empresa.

### 1.5 Segurança (o que o cidadão deve saber)

- Você **só vê** as empresas que **de fato representa** no cadastro do município.
  Não é possível "atuar como" uma empresa que não é sua — o sistema recusa.
- Ninguém vê seus dados fiscais sem passar pelo login. A sessão é protegida e não
  pode ser adulterada pelo navegador.

---

## 2. Consultar débitos e comprovantes (Meus Débitos)

A tela **Meus Débitos** mostra, no topo, quatro cartões: **Guias em aberto**,
**Dívida ativa**, **Total geral a pagar** (guias + dívida ativa) e **Caixa Postal**.

### 2.1 Lista "Minhas guias"

- Mostra **apenas as guias em aberto** (o que você realmente deve). Guias
  **canceladas não aparecem**.
- **Ordenar:** clique nos cabeçalhos **Guia**, **Vencimento** ou **Valor** para
  ordenar (clique de novo para inverter ↑↓).
- **Buscar:** filtre por número, ano ou origem (IPTU/ISS…).
- Guias que são **parcela de um parcelamento** aparecem com o selo roxo
  **"Parcela · PARC …"**; as demais mostram a origem (IPTU, ISS, DÍVIDA…).

### 2.2 Guias pagas (comprovante)

Clique em **"Ver guias pagas"** (no cabeçalho da lista) para ver as guias já
quitadas. Nelas, o botão vira **"Comprovante"**: o PDF sai com a marca d'água
**"Guia Paga"** e **sem** boleto/PIX — serve como comprovante de pagamento.
Para voltar, clique em **"Ver débitos em aberto"**.

---

## 3. Dívida ativa

O cartão **Dívida ativa** mostra o total inscrito em dívida ativa (débitos que
foram para cobrança). Hoje a consulta é informativa; para **negociar ou emitir
guia da dívida**, use o serviço de **Parcelamento** (§5) ou procure o Atendimento.

---

## 4. Certidão negativa (CND / CPEN)

No serviço **"Certidão negativa de débitos (CND)"** o sistema **apura sua
situação fiscal** na hora e:

- **Se você está em dia** → botão **"Emitir certidão (PDF)"** gera a certidão
  (CND, ou CPEN se houver débito só suspenso/parcelado), **assinada
  digitalmente**, com código de verificação.
- **Se você tem débitos exigíveis** → o portal informa o valor e explica que é
  preciso **regularizar (pagar ou parcelar)** antes de emitir, com atalho para
  os seus débitos.

---

## 5. Parcelamento de débitos (online)

No serviço **"Parcelamento de débitos"** você parcela sua **dívida ativa** sem ir
à prefeitura:

1. **Escolha o programa** (ex.: REFIS, Parcelamento Ordinário — os que a
   prefeitura tiver aberto).
2. O portal lista **quanto pode ser parcelado** (e, ao expandir, quais
   inscrições **entram** e quais **não entram** — já parceladas, em execução —
   com o valor).
3. **Informe o número de parcelas** (até o máximo do programa).
4. **Simule:** aparece a quebra **valor inscrito → atualização (juros/multa) →
   consolidado → honorários → total**, mais o **cronograma das parcelas**.
5. **Adira:** ao confirmar (você confessa o débito), o sistema gera o **termo em
   PDF** e as **guias das parcelas**, que passam a aparecer em Meus Débitos.

> O valor mostrado **já é atualizado** (com juros/multa até a data): a linha
> "Atualização" na simulação deixa isso explícito.

---

## Apêndice A — Resumo técnico (para revisão / operação)

> Detalhe de implementação da rotina 1. Público: revisor (Gabriel) e operação.

### A.1 Modelo

- **Uma pessoa (documento) → N identidades** ("representações"): o **titular** (o
  próprio contribuinte do documento) + as **empresas** que ele representa.
- Fonte da representação **hoje**: vínculo de **contador** já existente no
  tributário (`economicos_contadores.contador_contribuinte_id` → contribuinte;
  `economicos.contribuinte_id` → a empresa). Extensível a rep. legal/técnico e
  gov.br sem mudar a sessão/UI.

### A.2 Backend (tributário — branch `feat/portal-me-self-service`)

- `cadastro-economico`: `IEconomicoRepository.listEmpresasByContador()`
  (Prisma + in-memory) e o use case público `ListarEmpresasPorContadorUseCase`
  (exportado pelo índice do módulo — ADR-0025, sem vazar repositório).
- `portal-integration`: use case `ListarRepresentacoesPortalUseCase` (titular +
  empresas) e o endpoint `POST /portal-auth/contribuinte/representacoes`
  (protegido por `ServiceTokenGuard`; `assertTenantContext` fail-closed).

### A.3 Portal (BFF — `gpd-portal-cidadao`)

- Sessão (`portal_session`): `pessoa` (fixa), `representados[]` e `conta` =
  identidade **ativa** (o `conta.id` é o contribuinteId do JWT do tributário).
- `montarSessaoLogada()` centraliza o pós-login (senha/OTP/cadastro): busca as
  representações, ativa o titular e emite o token.
- `POST /api/auth/atuar-como { contribuinteId }`: autoriza contra
  `representados` (senão **403**) e reemite o token para a nova identidade.
- `GET /api/auth/me`: devolve `pessoa`, `representados`, `atuandoComoId`.
- UI: `AtuarComoSeletor` (só aparece com > 1 identidade).

### A.4 Segurança

- **Autenticação serviço-a-serviço** (`X-Service-Token`, comparação
  timing-safe, ≥16 chars) nos endpoints do tributário.
- **Autorização** do "atuar como" no BFF: o alvo tem de estar em `representados`.
- **Integridade da sessão**: o cookie `portal_session` é **assinado (HMAC-SHA256)**
  com `PORTAL_SESSION_SECRET`. Cookie sem assinatura ou adulterado é rejeitado
  (`conta = null`) — impede o cliente de forjar a lista de empresas. `httpOnly`
  + `sameSite=lax` + `secure` em produção.
- **JWT de backend nunca vai ao browser** — fica server-side na sessão.
- **Variável obrigatória**: `PORTAL_SESSION_SECRET` (ver `.env.example`).
  Fail-closed: sem segredo, a sessão não é emitida.

### A.5 Verificação e2e (feita)

1. Login OTP como contador → `/me` lista 2 identidades (titular + empresa).
2. `atuar-como` empresa → token reemitido, dados fiscais escopados à empresa.
3. `atuar-como` contribuinte **não** representado → **403**.
4. Cookie forjado (sem assinatura / assinatura falsa) → sessão rejeitada (401 / `conta:null`).

### A.6 Backend das rotinas §2–§5

Os endpoints do tributário que sustentam débitos/comprovante, dívida ativa,
CND/CPEN e parcelamento estão no `portal-me` (branch
`feat/portal-me-self-service` do `gpd-web-tribut-rio`, em revisão do Gabriel):

- Guias: `GET /portal-me/guias` (em aberto; `?pagas=1` = comprovantes; canceladas
  ocultas), `GET /portal-me/guias/:id/segunda-via.pdf` (`?atualizar=1&data=`).
- Dívida ativa: `GET /portal-me/divida-ativa/resumo`.
- Certidão: `GET /portal-me/certidao/apurar`, `GET /portal-me/certidao.pdf`.
- Parcelamento: `GET /portal-me/parcelamento/{programas,debitos}`,
  `POST /portal-me/parcelamento/{simular,aderir}`, `GET …/:id/termo.pdf`.

**Pendência fiscal:** a guia da parcela ainda não carrega o tributo de origem
(rateio por receita) — proposta em `gpd-web-tribut-rio/docs/propostas/
parcelamento-rateio-receita-por-tributo.md`.
