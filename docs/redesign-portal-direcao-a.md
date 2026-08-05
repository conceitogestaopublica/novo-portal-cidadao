# Redesign do Portal — Direção A (Institucional)

> **Quem decidiu o quê:** as decisões visuais abaixo são do responsável pelo negócio.
> Este documento é a especificação de implementação. Onde houver dúvida de comportamento,
> pergunte antes de escolher por conta própria (Regra de Ouro 7).
>
> **Referência visual:** as três direções foram apresentadas e comparadas em um comparativo
> visual; a **A (Institucional)** foi a escolhida.

---

## 1. Prioridade 1 — o menu some no celular (defeito)

**É o único item aqui que é correção de bug, não estética. Entregue primeiro e sozinho, se possível.**

Em [`portal-shell.tsx:61`](../src/modules/portal/components/portal-shell.tsx#L61) a navegação inteira está
sob `hidden md:flex` e **não existe alternativa mobile**. Abaixo de 768px somem:

- `Início`, `Todos os Serviços`
- o botão **Entrar** (visitante)
- `Meus Débitos`, `Minhas Solicitações`, o nome do cidadão e o **Sair** (logado)

Ou seja: **quem abre pelo telefone não alcança a área logada nem consegue sair.** Portal de
cidadão é majoritariamente mobile — isso invalida o produto no canal principal.

### Comportamento esperado

| Faixa | Comportamento |
|---|---|
| `≥ 768px` (`md`) | Como está hoje: nav horizontal completa. |
| `< 768px` | Botão **Entrar** (ou avatar, se logado) **sempre visível** no topo + botão `☰` que abre o menu. |

O menu aberto no celular deve conter **todos** os itens da nav de desktop, na mesma ordem, com
alvo de toque de no mínimo 44px de altura.

### Implementação

`sheet` **não está instalado**; `dialog` está. Duas saídas — escolha e justifique:

1. Instalar `sheet` via `add-shadcn-component` (é o componente natural para isso); ou
2. Estado local + painel `fixed inset-0` no próprio `portal-shell.tsx`, sem dependência nova.

Em qualquer das duas: fechar com `Esc`, fechar ao navegar, travar o scroll do body enquanto
aberto, devolver o foco ao botão `☰` ao fechar, e `aria-expanded`/`aria-controls` no gatilho.
O `portal-shell` já é Client Component, então não há mudança de fronteira.

### Aceite

- [ ] Em 390px de largura, é possível entrar, navegar e sair.
- [ ] Nenhum item da nav de desktop ficou inacessível no celular.
- [ ] Teclado: `Tab` alcança tudo, `Esc` fecha, foco volta ao gatilho.

---

## 2. Direção A — topo institucional

> **Ajuste feito durante a implementação, decidido pelo responsável pelo negócio:**
> a proposta original era a cor do município ocupando o topo. Ao ver rodando, optou-se
> por **topo em cinza institucional** (`COR_CHROME`, hoje `#334155`), igual ao bloco do
> município no rodapé — formando uma moldura em cima e embaixo do conteúdo claro.
> A cor do município passou para a **faixa de busca** e para os detalhes.
>
> Consequência aceita conscientemente: a identidade do município ficou **discreta** —
> dois municípios diferentes ficam parecidos entre si. Se um dia incomodar, engrossar
> a faixa de busca é o caminho natural, sem mexer na moldura.

Nada de gradiente — o gradiente azul→roxo anterior era genérico e não virava identidade
de prefeitura nenhuma. Topo e rodapé puxam de **uma constante única** (`COR_CHROME`, em
`portal-shell.tsx`): não duplicar o valor, senão os dois saem de sincronia.

A cor do município (`--mun`) entra na faixa de busca e nos detalhes.

- Faixa superior na cor do município: brasão + nome do município + nav.
- Faixa de busca logo abaixo, num tom mais escuro da mesma cor.
- Cards de ambiente com **borda superior de 3px** na cor do município; os `Em breve`
  ficam com borda neutra e opacidade reduzida.
- **Hierarquia por uso:** `Atendimento ao Contribuinte` ocupa **largura dupla** no grid —
  concentra 10 dos 12 serviços. Os demais, largura simples.
- Cantos de 4px (hoje há `rounded-xl` em vários pontos — reduzir).

Manter tokens de tema do shadcn e `cn()`; **nenhum HEX solto** (Regra de Ouro / ADR-0002).
A cor do município entra como CSS custom property, não como classe Tailwind fixa.

---

## 3. Rodapé — assinatura GPECloud

Decidido: **a prefeitura lidera no topo, a GPECloud assina no rodapé.** Motivo de negócio:
evita atrito em licitação e em troca de prefeito, e o cidadão vê a prefeitura dele.

São **dois blocos com origens diferentes** — não confundir:

| Bloco | De quem | Origem do dado |
|---|---|---|
| Faixa 1 (escura) | **do município** | dinâmico, por tenant |
| Faixa 2 (clara) | **da Conceito** (quem desenvolveu) | constante fixa, igual em todo município |

**Faixa 1 (escura, como hoje)** — contato da prefeitura, acesso rápido, legislação.
É o bloco que o cidadão procura quando quer falar com a **prefeitura dele**.
Campos: `nome`, `cidade`, `uf`, `telefone`, `email`, `site` — **todos já existem no tipo `Ug`**
([`portal.ts`](../src/shared/types/portal.ts)), vindos do cadastro do GED, exatamente como o
brasão (ver §4). Hoje só `nome` é preenchido; os demais chegam com o mesmo enriquecimento.
Cada campo é opcional — **renderize condicionalmente**, nunca com valor inventado de exemplo.

**Faixa 2 (clara, nova)** — **branco puro** (`#fff`) com borda superior.

> **Não troque por cinza-claro.** A maquete previa `#f2f5f9`; ao implementar, o
> retângulo branco do logo ficou **visível** sobre esse cinza. O arquivo não tem
> transparência, então qualquer fundo que não seja `#fff` denuncia a moldura branca.
> Só um PNG transparente ou SVG libera outra cor aqui.
- **Esquerda:** dados da Conceito Gestão Pública + a **versão** do portal.
- **Direita:** o logo GPECloud, alinhado à direita, ~190px de largura.

> **Por que faixa clara e não azul:** o arquivo do logo **não tem transparência** (RGB, sem
> canal alpha) — sobre azul apareceria um retângulo branco. Além disso o logo é azul; sobre
> fundo azul perderia contraste. Se um dia existir um PNG transparente ou SVG, a faixa azul
> volta a ser opção.

### Assets (já no repositório)

| Arquivo | Uso |
|---|---|
| `public/gpecloud-portal-transparencia.png` | 760×218, 67 KB |
| `public/gpecloud-portal-transparencia.webp` | 760×218, 21 KB |

Recortados da margem original e redimensionados. Use `next/image` apontando para o PNG —
o Next serve o WebP automaticamente para quem suporta. **Sempre com `alt` descritivo.**

### Versão exibida

Ler de `package.json` em build time. Objetivo declarado: encurtar chamado de suporte —
saber qual versão o município roda sem precisar perguntar.

### Dados da empresa

Fornecidos pelo responsável pelo negócio — usar exatamente assim:

```
Conceito Gestão Pública
R. Paraíba, 889 — Savassi, Belo Horizonte/MG · CEP 30130-145
(31) 99886-5398 · adm@conceitogestaopublica.com.br
```

Onde declarar: **não** hard-coded no JSX do rodapé. São dados institucionais que mudam sem
mexer em tela — coloque numa constante única (ex.: `shared/config/empresa.ts`) e consuma dali.
O telefone é celular: se for WhatsApp, o link `wa.me` vale mais que `tel:` para o cidadão.

---

## 4. Identidade por município (brasão + cor)

Decisão de negócio: **cada prefeitura com seu brasão e sua cor.** Importante para vender a
vários municípios.

### O que já existe

`Ug` em [`portal.ts`](../src/shared/types/portal.ts) **já tem** `brasao`, `cidade`, `uf`,
`telefone`, `email`, `site` — o tipo espelha o schema do GED. E
[`(portal)/layout.tsx:19`](../src/app/(portal)/layout.tsx#L19) já registra a intenção:

> `M0: UG a partir do tenant-map. M1/M3: enriquecer com brasão/banners/contato do GED.`

Hoje só `nome` é preenchido. **O brasão não precisa de cadastro novo** — o caminho já
decidido é enriquecer a `Ug` a partir do GED, via adapter (Regra de Ouro 9).

### O que falta

**A cor não existe em lugar nenhum.** (O `cor` que aparece em `portal.ts:28` é de
`Categoria`, não do município — não reaproveitar.)

Onde guardar é decisão de arquitetura, não minha: avalie `TenantConfig` no `tenant-map`
(que já é o lugar da config por município e prevê evoluir para tabela `portal_tenants`)
versus vir do GED junto com o brasão. **Escolha, justifique, e registre em ADR** — é decisão
estrutural (Regra de Ouro 8).

### Requisitos da cor

- Contraste do texto branco sobre a cor deve atingir **AA (4.5:1)**. Município que escolher
  uma cor clara não pode quebrar a legibilidade — derive um tom mais escuro ou rejeite no cadastro.
- Fallback quando não houver cor: o azul institucional atual.
- Fallback quando não houver brasão: o ícone `Landmark` atual (já implementado).

---

## 5. Fora de escopo (deliberadamente)

- **Renomear os ambientes** ("Pagar meus impostos" em vez de "Atendimento ao Contribuinte"):
  era da direção C, não escolhida. Mexe no cadastro da Carta de Serviços e no que a prefeitura
  já divulgou — é decisão de negócio, não de tela.
- **Tela de cadastro de brasão/cor no console admin:** só se a arquitetura escolhida em §4
  exigir. Se vier do GED, não é necessária.
- **Trocar o logo por um que diga "Portal do Cidadão":** o arquivo atual diz *"Portal da
  Transparência"*. O responsável pelo negócio sabe e classificou como provisório. Registrado
  aqui para não passar batido: o cidadão lê "Transparência" numa tela que é de Carta de Serviços.

---

## 6. Governança

Vale tudo do [`CLAUDE.md`](../CLAUDE.md) e o template
[`docs/templates/nova-funcionalidade-frontend.md`](templates/nova-funcionalidade-frontend.md).
Em especial: reutilize antes de criar, sem dependência nova sem aprovação, fronteira de módulo,
e `tsc --noEmit` + `lint` + `test` passando com o resultado colado na resposta.
