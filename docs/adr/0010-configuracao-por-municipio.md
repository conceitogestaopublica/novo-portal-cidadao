# ADR-0010 — Configuração e credenciais por município

- **Status:** Aceito, com **um ponto em aberto** (ver §"Quem cadastra")
- **Data:** 2026-08-03
- **Motivador:** o gov.br ([ADR-0009](0009-identidade-do-cidadao.md)) exige credenciais
  próprias de cada município

---

## Contexto

Hoje a configuração de cada município vive **inteira dentro de uma única variável de
ambiente**, `PORTAL_TENANTS`, com um JSON que descreve todos os municípios de uma vez
(`shared/lib/tenant-map.ts`). Segredo já mora aí: o `gpe2ProtocoloToken` do gateway de
Protocolo.

Esse desenho foi consciente e está documentado no próprio arquivo:

> *MVP: mapa em memória, alimentado por env (`PORTAL_TENANTS` JSON) com um fallback de
> desenvolvimento. **Evolução: tabela `portal_tenants` no banco do portal.***

Com um ou dois municípios, funciona. O gov.br é o que torna a evolução necessária.

### O que o gov.br acrescenta, por município

Conferido na [documentação oficial](https://acesso.gov.br/roteiro-tecnico/iniciarintegracao.html)
em 2026-08-03:

- `client_id` — identificador, não é segredo
- `client_secret` — **é segredo**
- URL de retorno (redirect URI) — **distinta por município**, porque cada prefeitura
  tem seu próprio subdomínio
- Tudo isso **duas vezes**: homologação (`sso.staging.acesso.gov.br`) e produção

São de quatro a seis valores novos por município, parte deles sigilosos, empilhados num
JSON de variável de ambiente.

### Problemas concretos do modelo atual

1. **Adicionar município exige editar a configuração do servidor e reiniciar.**
2. **Erro em um derruba todos** — uma vírgula fora do lugar invalida o JSON inteiro e o
   `loadMap()` cai silenciosamente no fallback de desenvolvimento.
3. **Segredo em variável de ambiente**, visível a quem tem acesso ao servidor e a
   arquivos de deploy.
4. **Rotação de credencial vencida exige deploy.**
5. **Não existe onde cadastrar** — cada município novo depende do desenvolvedor.

## Decisão

**Mover a configuração por município de `PORTAL_TENANTS` para uma tabela `portal_tenants`
no banco próprio do portal**, mantendo a variável de ambiente como fallback (útil em
desenvolvimento e para o primeiro município, antes de existir tela).

**Segredos cifrados em repouso.** `client_secret` e `gpe2ProtocoloToken` não podem ficar em
texto puro no banco.

> **Reaproveitar, não inventar** (Regra de Ouro 2): o backend do tributário já resolve isso
> em `shared/infrastructure/crypto/field-encryption.service.ts` — AES com
> `FIELD_ENCRYPTION_KEY` de 32 bytes, mais SHA-256 para busca indexada. É o mesmo mecanismo
> que protege os CPFs dos contribuintes. Copiar o padrão, não escrever criptografia nova.

**Segredo é write-only na interface.** Digita-se e salva-se; nunca é devolvido para a tela.
A tela mostra apenas *"configurado em <data>"*. Segredo exibido é segredo que vaza por
print de tela, por ombro e por log de navegador.

**Validar antes de salvar.** Configuração de integração que só falha na hora do uso gera
chamado difícil: um botão "testar conexão" que exercite a credencial de verdade evita que
um erro de digitação só apareça quando o cidadão tentar entrar.

## Quem cadastra — PONTO EM ABERTO

As credenciais são emitidas pelo governo federal **ao município**, não a nós. Então há duas
saídas, e elas mudam o que se constrói:

| | Onde fica a tela | Implicação |
|---|---|---|
| **A. A Conceito cadastra** | tela interna, lista todos os municípios | mais simples, menos superfície de risco; a prefeitura envia os valores |
| **B. A prefeitura cadastra** | console do próprio município | exige controle de acesso: um município **nunca** pode ver a credencial de outro |

**Recomendação: A**, enquanto forem poucos municípios. Menos superfície de exposição de
segredo e nenhuma necessidade de isolamento entre prefeituras no console. Migrar de A para
B depois é possível; o contrário é mais difícil.

> **Esta escolha ainda não foi confirmada pelo responsável pelo negócio.** O ADR foi escrito
> com a recomendação A; **confirmar antes de implementar a tela.** A tabela e a criptografia
> valem para as duas opções, então essa parte não fica bloqueada.

## Consequências

**Positivas**

- Município novo entra sem reiniciar servidor e sem risco de derrubar os demais.
- Credencial vencida troca sem deploy.
- Segredo cifrado, e não mais em variável de ambiente.
- Vira possível ter tela — hoje não existe lugar nenhum para cadastrar integração.

**Negativas / custos**

- Mais uma tabela e mais um caminho de leitura para manter.
- Chave de criptografia vira dependência de operação: **perder a `FIELD_ENCRYPTION_KEY`
  significa perder todos os segredos cifrados**. Precisa de guarda e de plano de rotação.
- Configuração no banco é mais difícil de versionar que arquivo — a compensação é registrar
  quem alterou e quando.

## Escopo

Este ADR decide **o caminho**, não manda implementar. O gov.br está bloqueado por fora: sem
a adesão do **município** à Rede Nacional de Governo Digital não existe credencial para
cadastrar (ADR-0009).

**Ordem sugerida:** confirmar quem cadastra → tabela `portal_tenants` com segredo cifrado →
tela → só então a integração gov.br em si.

## Alternativas descartadas

- **Continuar só em `PORTAL_TENANTS`** — não escala, e coloca segredo de cada prefeitura em
  variável de ambiente compartilhada. Fica como fallback de desenvolvimento, não como destino.
- **Cofre de segredos gerenciado** (AWS Secrets Manager, Vault) — é o mais correto em
  segurança, mas acrescenta dependência de infraestrutura desproporcional ao tamanho atual.
  Reavaliar quando houver muitos municípios em produção.
- **Um arquivo de configuração por município no disco** — resolve o "erro em um derruba
  todos", mas mantém deploy para cada mudança e não abre caminho para tela.
