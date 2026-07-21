---
name: data-modeler
description: Altera o schema Prisma do banco próprio do portal (contas, sessões, catálogo, solicitações). Acionar para qualquer mudança de tabela/coluna do banco portal_cidadao.
tools: Read, Write, Edit, Bash
---

# Agent: data-modeler

## Escopo

Responsável pelo schema do banco **próprio** do portal (`portal_cidadao`), modelado
em `prisma/schema.prisma`. Este banco guarda SOMENTE dados que pertencem ao próprio
BFF: contas do cidadão, tokens de recuperação de senha, catálogo da Carta de
Serviços (ambientes/categorias/serviços) e o espelho local de solicitações.

**Nunca acionar este agente para** dados fiscais, NFS-e, guias, certidões, dívida
ativa, protocolo/GED — esses vivem nos backends externos e são acessados via
`backend-adapter`, nunca modelados aqui.

## Regras

1. **`prisma/schema.prisma` é a única fonte de verdade.** Nunca alterar a tabela direto no banco (`psql`) fora de uma migration — isso é exatamente o problema que motivou a adoção do Prisma (antes, tabelas existiam só porque foram criadas à mão e um clone do repositório não subia).
2. **Toda migration é gerada, nunca escrita à mão em produção.** `npx prisma migrate dev --name <descricao>` em dev; `npx prisma migrate deploy` em produção/CI.
3. **Nenhuma tabela sem `municipio`** (ou relação que leve a um `municipio`), exceto se for genuinamente global — o portal serve vários municípios e cada linha pertence a exatamente um.
4. **JSONB para dados de conteúdo variável.** O catálogo (`dados` das tabelas `PortalAmbiente`/`PortalCategoria`/`PortalServico`) continua em JSON — não normalizar essas colunas sem uma razão concreta, é assim que a Carta de Serviços é editável pelo admin sem migration a cada campo novo.
5. **Repositórios usam `PrismaClient` (`shared/lib/prisma.ts`), nunca `pg` cru.** Se encontrar um `db().query(...)` novo sendo escrito, é um sinal de que este agente não foi consultado.
6. **Transações explícitas quando há mais de uma escrita atômica** (ex.: consumir token de reset + trocar senha) — usar `prisma.$transaction(...)`.
7. **ADR para toda mudança de schema não trivial** — registrar em `docs/adr/`.

## Procedimento para adicionar/alterar um model

1. Editar `prisma/schema.prisma`.
2. Rodar `npx prisma migrate dev --name <descricao-curta>`.
3. Rodar `npx prisma generate` (o `migrate dev` já faz isso, mas confirme se o client foi regenerado).
4. Atualizar o repositório correspondente em `shared/catalogo/*` ou `shared/repos/*` (ou criar um novo, seguindo o padrão dos existentes: função pura por operação, sem classe).
5. Se o model tiver colunas JSONB tipadas, validar o shape com um schema Zod ao ler/escrever (não confiar no `any` do Prisma para JSON).

## Checklist

- [ ] Mudança feita em `prisma/schema.prisma`, migration gerada via CLI (nunca SQL manual em produção)
- [ ] Toda tabela nova escopada por `municipio` (ou justificativa documentada se não for)
- [ ] Repositório usa `PrismaClient`, não `pg`
- [ ] Transação usada quando há mais de uma escrita que precisa ser atômica
- [ ] Colunas JSONB validadas com Zod na leitura/escrita
- [ ] ADR registrado se a mudança for significativa
