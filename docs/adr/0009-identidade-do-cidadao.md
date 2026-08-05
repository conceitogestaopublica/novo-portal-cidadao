# ADR-0009 — Modelo de identidade do cidadão (senha, gov.br e certificado digital)

- **Status:** Aceito — decisão de escopo tomada pelo responsável pelo negócio
- **Data:** 2026-08-03
- **Contexto de decisão:** gov.br **e** certificado digital estão no escopo do produto

---

## Contexto

Hoje o cidadão entra no portal de um jeito só: `documento + senha` (ou OTP), com a senha
guardada em `PortalConta.senhaHash`. A conta só é criada **se o tributário confirmar que
aquele documento é contribuinte do município** — ver `POST /api/auth/cadastrar`.

Esse acoplamento tem uma consequência que apareceu na prática: um bug no tributário
impediu completamente o cadastro no portal, mesmo com o contribuinte existindo na base.
Identidade e cadastro fiscal são coisas diferentes e hoje estão amarradas.

Além disso, dois meios de entrada entraram no escopo:

- **gov.br** — o cidadão brasileiro já tem essa conta; é o login único de fato do setor público
- **certificado digital ICP-Brasil** (e-CPF/e-CNPJ) — como empresas e contadores costumam
  se autenticar para obrigações fiscais (NFS-e, DES-IF, DMS)

## Decisão

**Separar identidade de cadastro fiscal.** `PortalConta` passa a representar *quem a pessoa é*.
O vínculo com o contribuinte (`contribuinteId`) vira **consequência**, não pré-requisito.

**Suportar três meios de entrada para a mesma conta**, sem duplicar contas por meio usado:

| Meio | Quem usa | Situação |
|---|---|---|
| Documento + senha | cidadão sem gov.br | existe hoje |
| gov.br (OIDC) | cidadão em geral | a implementar |
| Certificado ICP-Brasil | empresa, contador | a implementar |

A chave da identidade continua sendo **`(documento, municipio)`** — que já é a chave única
de `PortalConta`. Os três meios convergem para o mesmo CPF/CNPJ, então convergem para a
mesma conta. Quem entra hoje por senha e amanhã por gov.br **é a mesma pessoa e a mesma conta**.

### Preparação de schema (fazer agora, barato)

Hoje há **zero contas de cidadão** (`portal_contas` vazia). Preparar o modelo agora custa
uma migration; depois de milhares de contas, custa uma migração de dados.

Nova tabela `portal_conta_identidades` — uma linha por meio de entrada vinculado à conta:

- `contaId` → `PortalConta`
- `provedor` — `SENHA` | `GOVBR` | `CERTIFICADO`
- `sujeito` — identificador no provedor (o `sub` do gov.br; do certificado, o CPF/CNPJ do titular)
- `nivel` — selo/nível de confiabilidade no momento do vínculo
- `criadoEm`, `ultimoUsoEm`
- único por (`provedor`, `sujeito`)

`senhaHash` **continua** em `PortalConta` e continua opcional — quem entra só por gov.br
nunca define senha.

### Nível de confiabilidade governa o que se pode fazer

O gov.br classifica contas em **bronze / prata / ouro**, e expõe **selos** que dizem *como*
a identidade foi comprovada (de validação em base do INSS a biometria da identidade nacional).

Não basta "entrou com gov.br". Serviço que movimenta dinheiro ou emite documento com efeito
legal — parcelamento, CND, DTE — deve **exigir nível mínimo**, e recusar com mensagem que
explique como o cidadão eleva o nível dele. O nível exigido por serviço é configuração, não
código fixo.

Certificado ICP-Brasil equivale ao nível mais alto: a identidade é comprovada por autoridade
certificadora.

## Consequências

**Positivas**

- Cadastro deixa de depender do tributário estar no ar. O tributário passa a responder
  *"quanto essa pessoa deve"*, não *"essa pessoa existe"*.
- Cidadão sem cadastro fiscal no município (ex.: prestador de fora) tem conta sem gambiarra.
- Argumento comercial: prefeitura reconhece gov.br, e o cidadão não cria mais uma senha.
- Empresa e contador entram do jeito que já trabalham.

**Negativas / custos**

- Três caminhos de autenticação para manter e testar, em vez de um.
- Dependência de serviço externo do governo federal: indisponibilidade do gov.br vira
  indisponibilidade de login. **Manter senha própria como alternativa** é o que evita
  isso virar ponto único de falha.
- Credenciamento não é trivial (ver abaixo).

## Pré-requisitos externos (verificados em 2026-08-03)

Fonte: [roteiro técnico do Login Único](https://acesso.gov.br/roteiro-tecnico/iniciarintegracao.html)
e [Autenticação gov.br](https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/transformacao-digital/ferramentas/autenticacao-gov.br).

- O **município** precisa ter aderido à Rede Nacional de Governo Digital. **É a prefeitura
  que adere, não nós** — e isso é pré-requisito comercial, entra na conversa de venda.
- Credenciais (`client_id`/`client_secret`) são solicitadas por município; cada pedido é
  analisado individualmente e recebe um gerente de projeto do governo.
- Há ambiente de homologação (`sso.staging.acesso.gov.br`) e produção. A homologação exige
  **demonstração em vídeo** dos fluxos de login, redirecionamento e logout.
- Todo o canal em HTTPS. Em celular, usar navegador nativo — **não WebView**.

> Estes pontos foram conferidos na data acima. Antes de implementar, **reconferir na fonte
> oficial**: é serviço do governo e muda.

Implicação multi-tenant: as credenciais são **por município**, então entram no `tenant-map`
junto com o resto da configuração — mesma mecânica de `gpe2GestoraId`/`gpe2ProtocoloToken`.

## Reaproveitamento (Regra de Ouro 2)

Antes de escrever criptografia de certificado do zero, olhar o que já existe na plataforma:

- **GED** — truststore ICP-Brasil configurado (`config/icp_brasil.php`), política AD-RB v2,
  e **já extrai CPF e CNPJ de dentro do certificado** pelos OIDs `2.16.76.1.3.1` (e-CPF) e
  `2.16.76.1.3.3` (e-CNPJ): `AssinaturaService::extrairCpf()/extrairCnpj()`, usados em
  `AssinaturaController` e no comando `InspecionarPfx`.
- **Tributário** — módulo `assinatura` com PAdES e provider de certificado A1 (`p12-info.ts`).

**A extração da identidade, que é o coração da autenticação por certificado, já está
resolvida no GED** — não reimplementar. O trabalho novo é o restante do fluxo: desafio
(nonce) assinado pelo cliente para provar posse da chave privada, validação da cadeia
contra o truststore, verificação de revogação (CRL/OCSP) e validade, e só então casar o
CPF extraído com `PortalConta`.

> **Atenção ao truststore:** hoje o GED tem só a raiz (`raizicpbrasilv10.pem`) e a pasta
> `intermediarias` está **vazia**. Sem as intermediárias, validação de cadeia falha para
> certificado real. Popular antes de qualquer teste.

## Escopo desta decisão

Este ADR decide o **modelo** e autoriza a **preparação do schema**. Não autoriza implementar
gov.br nem certificado — cada um é projeto próprio, com credenciamento e homologação.

**Ordem recomendada:** destravar o cadastro atual → portal no ar em um município →
gov.br → certificado. Federação de identidade antes de existir a primeira conta é
construir o segundo andar antes do primeiro.

## Alternativas descartadas

- **SSO próprio entre os produtos (tributário, gpe2, GED, portal)** — resolve dor de
  *servidor*, não de cidadão. São ~5 operadores hoje: dor pequena, custo alto. Reavaliar
  quando forem muitos municípios e muitos servidores.
- **Só gov.br, sem senha própria** — deixaria o login refém da disponibilidade de um
  serviço externo, e excluiria quem não tem conta gov.br.
- **Conta separada por meio de entrada** — a mesma pessoa teria duas contas ao trocar de
  senha para gov.br, e perderia seu histórico de solicitações.
