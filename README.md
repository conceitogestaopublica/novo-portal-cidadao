# Portal do Cidadão

Portal único do município (Next.js + BFF). O cidadão navega a **Carta de
Serviços** (Lei 13.460), faz login, resolve serviços fiscais em autoatendimento
(2ª via, dívida ativa, certidão, parcelamento, caixa postal do DTE) e abre
solicitações que viram **protocolo no gpe2**.

Projeto **independente** dos demais: fala com o tributário (NestJS) e o gpe2
(Laravel) **por API**, sempre server-side. O navegador nunca vê JWT de backend —
só o cookie de sessão do portal.

## Como rodar

Precisa de **Node 20+** e um **PostgreSQL**.

```bash
npm install
cp .env.example .env.local     # preencha — ver "Variáveis" abaixo
npm run dev                    # http://localhost:3001
```

## Banco

O portal tem **database próprio** (`portal_cidadao`). Pode viver no mesmo
servidor PostgreSQL do tributário — são bancos separados, não servidores.

O acesso é por **SQL cru** (`pg`), sem ORM. A estrutura versionada está em
[`db/schema.sql`](db/schema.sql), que é a fonte da verdade:

```bash
createdb portal_cidadao
psql -d portal_cidadao -f db/schema.sql
```

Com o PostgreSQL em container (ex.: o `tributario_db` do backend tributário):

```bash
docker exec -i tributario_db psql -U postgres -c "CREATE DATABASE portal_cidadao;"
docker exec -i tributario_db psql -U postgres -d portal_cidadao < db/schema.sql
```

> **Ao alterar tabelas, regenere o dump** — senão o repositório passa a mentir:
>
> ```bash
> docker exec tributario_db pg_dump -U postgres -d portal_cidadao \
>   --schema-only --no-owner --no-privileges > db/schema.sql
> ```
>
> (preserve o cabeçalho explicativo do arquivo).

O **catálogo** (ambientes → categorias → serviços) nasce vazio e é semeado no
primeiro acesso. Para cadastrar/editar pelo navegador, use o `/admin`.

## Variáveis

O template completo e comentado está em [`.env.example`](.env.example). As que
travam a subida:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Banco do portal (`portal_cidadao`) |
| `TRIBUTARIO_BASE_URL` | API v1 do backend tributário |
| `PORTAL_SERVICE_TOKEN` | Integração serviço-a-serviço; **tem que bater** com o valor configurado no tributário |
| `PORTAL_SESSION_SECRET` | Assina (HMAC) o cookie de sessão — sem ele a sessão seria forjável. Gerar: `openssl rand -hex 32` |
| `PORTAL_ADMIN_SENHA` | Senha do admin da Carta de Serviços. **Vazio = admin desabilitado** |

## Áreas

| Rota | Quem entra | Como |
|---|---|---|
| `/` | cidadão | público (Carta de Serviços) |
| `/fiscal/*` | contribuinte | documento + OTP (ou senha) |
| `/minhas-solicitacoes` | contribuinte | idem |
| `/admin` | servidor do município | `PORTAL_ADMIN_SENHA` |

As duas sessões são **separadas** (`portal_session` × `portal_admin`): cookies
distintos, ambos assinados e httpOnly.

## Multi-tenant

Em produção o município vem do **subdomínio**. Em desenvolvimento é
single-tenant, fixado por `DEV_TENANT_SUBDOMAIN`.

Para adicionar um município: [`docs/como-adicionar-municipio.md`](docs/como-adicionar-municipio.md).

## Documentação

- [`docs/como-adicionar-municipio.md`](docs/como-adicionar-municipio.md) — multi-tenant na prática
- [`docs/contrato-gpe2-protocolo-portal.md`](docs/contrato-gpe2-protocolo-portal.md) — contrato do Protocolo com o gpe2
