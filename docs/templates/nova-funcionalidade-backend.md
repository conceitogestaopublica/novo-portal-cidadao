# PROMPT — Nova Funcionalidade (Backend)

> **Como usar:** copie este arquivo, preencha os campos `[entre colchetes]` e cole no
> Claude Code já dentro do repositório do backend. Não edite as seções fixas — elas
> são o contrato de comportamento. Apague esta linha e o bloco de instrução ao colar.

> **⚠️ Escopo: este template NÃO é deste repositório.** Ele descreve o backend NestJS
> (Controller → Service → Repository, `TenantContext`, `ZodValidationPipe`, RBAC por
> permission) e cita os agents `module-architect`, `api-builder`, `security-reviewer`
> e `test-writer`, que **não existem** em `gpd-portal-cidadao`. Está guardado aqui
> apenas como cópia de referência da governança da plataforma — cole-o no repositório
> do backend, nunca neste. Para trabalhar no portal, use
> [nova-funcionalidade-frontend.md](nova-funcionalidade-frontend.md).

---

## Contexto da governança (não ignore)

Antes de qualquer coisa, **leia e siga**: `CLAUDE.md`, os agents em `.claude/agents/`,
as skills em `.claude/skills/` e os ADRs em `docs/adr/`. Esta tarefa está subordinada
a todas as Regras de Ouro do projeto. Em caso de conflito entre este pedido e a
governança, a governança vence — e você me avisa.

Acione os agents/skills pertinentes (no mínimo: `reuse-auditor` antes de criar código,
`module-architect` se for módulo novo, `data-modeler` se mexer no schema,
`api-builder` para endpoints, `security-reviewer` ao final, `test-writer` para testes;
skill `create-module` ou `add-entity`/`add-endpoint` conforme o caso).

---

## O que eu quero

**Funcionalidade:** [nome curto da funcionalidade]

**Módulo:** [nome do módulo existente OU "novo módulo: <nome>"]

**Descrição do comportamento esperado:**
[Descreva o que a funcionalidade deve fazer, em linguagem de negócio. Liste as regras
de negócio relevantes. Seja específico sobre o que está dentro e fora do escopo.]

**Entidades/dados envolvidos:**
[Liste entidades e campos. Se algum campo/tabela não existir ainda, NÃO presuma —
veja a seção "Regras desta tarefa".]

**Endpoints desejados (se aplicável):**
[Ex.: listar, criar, atualizar, remover, ações específicas. Indique quais permissões
RBAC cada um exige.]

**Permissões/papéis (RBAC):**
[Quem pode usar o quê. Se for preciso uma permission nova, diga o nome dela.]

---

## Regras desta tarefa (fixas — não alterar)

1. **Não invente nada.** Se uma entidade, campo, regra de negócio, permissão ou
   comportamento não estiver definido acima, **pare e me pergunte** — não escolha por
   conta própria. Liste as dúvidas de forma enumerada com sua recomendação.
2. **Reutilize antes de criar.** Rode mentalmente o `reuse-auditor`: procure em
   `common/` e `shared/` por serviços, guards, pipes, decorators, DTOs base e utils
   que já resolvam parte do problema. Só crie algo novo se não houver reaproveitamento,
   e justifique.
3. **Respeite o multitenancy.** Toda tabela de negócio vive no banco do tenant, nunca
   no registry. Todo acesso a dados resolve o tenant pelo `TenantContext`. Nenhuma
   query pode cruzar tenants.
4. **Respeite as camadas.** Controller → Service → Repository. Controller não toca
   Prisma. DTOs com Zod + `ZodValidationPipe`. Erros via exception filter padrão.
   Respostas no envelope padrão do projeto.
5. **Sem dependências novas** sem me perguntar antes.
6. **Schema e migrations:** qualquer alteração de schema passa pelo `data-modeler`,
   gera migration e considera o impacto em "migrar todos os tenants".
7. **Testes:** entregue testes para a regra de negócio principal, no padrão do projeto.
8. **ADR:** se esta funcionalidade introduzir uma decisão estrutural (novo padrão,
   nova fronteira de módulo, nova convenção), crie um ADR em `docs/adr/`.
9. **Atualize a documentação** do módulo afetado se o comportamento público mudar.

---

## Ordem de execução

1. Confirme que entendeu o escopo. Liste todas as dúvidas/ambiguidades ANTES de
   codar. Não gere código com dúvida em aberto.
2. Apresente um plano curto: arquivos a criar/alterar, o que será reutilizado, e o
   que (se algo) será criado do zero e por quê.
3. Após meu OK, implemente seguindo a governança.
4. Ao final, liste: arquivos tocados, o que foi reutilizado, o que foi criado novo,
   testes adicionados, ADR criado (se houver), e o que ficou deliberadamente de fora.

---

## Checklist antes de finalizar

- [ ] Não inventei nenhuma entidade/campo/regra não especificada — perguntei o resto.
- [ ] Procurei e reutilizei código de `common/` e `shared/`.
- [ ] Nenhuma dependência nova sem aprovação.
- [ ] Multitenancy preservado; nenhuma query cruza tenants.
- [ ] Camadas respeitadas; Controller não acessa Prisma.
- [ ] DTOs com Zod; erros e respostas no padrão do projeto.
- [ ] Testes da regra principal entregues.
- [ ] ADR criado se houve decisão estrutural.
- [ ] Documentação do módulo atualizada se o contrato público mudou.
