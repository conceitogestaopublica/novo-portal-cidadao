# Como adicionar um município (multi-tenant)

Guia prático para conectar um novo município ao Portal do Cidadão — exemplo:
**Paraguaçu**. Público: operação / Gabriel.

---

## 1. O conceito: duas camadas

O **portal não conecta direto** no banco de nenhum município. Quem tem o banco
fiscal é o **tributário**. O portal apenas **roteia** cada município (pelo
subdomínio) para o tributário certo, informando de qual tenant é o acesso.

```
Cidadão → paraguacu.portal.gov.br
        → PORTAL (BFF) resolve o subdomínio "paraguacu"
        → chama o TRIBUTÁRIO com header  x-tenant-subdomain: paraguacu
        → TRIBUTÁRIO despacha as queries para o banco  tributario_paraguacu
```

O tributário usa **um banco por município** (database-per-tenant — ADR-0001). A
connection string **nunca** vem do cliente: é **derivada no servidor** a partir de
um template (`TENANT_DATABASE_URL_TEMPLATE`), por segurança.

---

## 2. Passo 1 — Provisionar o município no TRIBUTÁRIO (onde vive o dado)

No `.env` do **tributário** (`gpd-web-tribut-rio`), ligue o multi-tenant e defina o
template de conexão (o `{db}` é substituído pelo nome do banco do tenant):

```bash
MULTITENANCY_ENABLED=true
REGISTRY_DATABASE_URL="postgresql://postgres:senha@HOST:5432/tributario_registry"
TENANT_DATABASE_URL_TEMPLATE="postgresql://postgres:senha@HOST:5432/{db}?schema=public"
PROXY_SHARED_SECRET="<openssl rand -hex 24>"
PORTAL_SERVICE_TOKEN="<openssl rand -hex 24>"
```

Provisione o município (cria o banco dedicado, aplica migrations, semeia o admin e
registra no registry central):

```bash
npm run tenant:provision -- --subdomain=paraguacu --name="Paraguaçu"
```

- Cria um banco isolado (ex.: `tributario_paraguacu`) só do Paraguaçu.
- A **senha do admin** é exibida **uma única vez** no fim — anote.
- Alternativa via API de admin: `POST /api/v1/admin/tenants { "subdomain": "paraguacu", "name": "Paraguaçu" }`.

> Você **não** cadastra uma connection string por município. Configura o **template
> uma vez** e o nome do banco de cada tenant é derivado do subdomínio. Isso impede
> apontar para um banco arbitrário (segurança).

---

## 3. Passo 2 — Apontar o PORTAL para o município

No `.env` do **portal** (`gpd-portal-cidadao`), defina a variável **`PORTAL_TENANTS`**
— um JSON com um município por chave. A chave é o **subdomínio que o cidadão acessa**:

```json
{
  "paraguacu": {
    "municipio": "paraguacu",
    "nome": "Paraguaçu",
    "tributarioSubdomain": "paraguacu",
    "baseUrls": { "tributario": "https://api.paraguacu.gov.br/api/v1" }
  },
  "santoantonio": {
    "municipio": "santoantonio",
    "nome": "Santo Antônio do Amparo",
    "tributarioSubdomain": "santoantonio",
    "baseUrls": { "tributario": "https://api.santoantonio.gov.br/api/v1" }
  }
}
```

Campos:

| Campo | O que é |
|---|---|
| **chave** (`"paraguacu"`) | subdomínio do portal (`paraguacu.portal…`) |
| `municipio` | identificador do município (recomendado: código IBGE) |
| `nome` | nome exibido no cabeçalho |
| `tributarioSubdomain` | o subdomínio usado no `tenant:provision` |
| `baseUrls.tributario` | URL da API do tributário que atende esse município |
| `gedPortalSlug` / `gpe2Gestora` | (opcional) tenant no GED / gpe2, quando integrados |

O mapa fica em `src/shared/lib/tenant-map.ts` (hoje alimentado por `PORTAL_TENANTS`;
evolução prevista: tabela `portal_tenants` no banco do portal).

---

## 4. Os segredos precisam **bater** entre portal e tributário

| Segredo | Portal | Tributário | Para quê |
|---|---|---|---|
| `PORTAL_SERVICE_TOKEN` | igual | igual | header `X-Service-Token` (só o BFF fala com o tributário) |
| `PROXY_SHARED_SECRET` | igual | igual | header `x-proxy-secret` (obrigatório com multi-tenant) |

Se não baterem, o tributário recusa (401 "Credencial de serviço inválida").

Além disso, no portal: `PORTAL_SESSION_SECRET` (assina o cookie de sessão) — ver
`.env.example`.

---

## 5. Como está hoje (local) × produção

- **Hoje (dev, single-tenant):** o tributário está com `MULTITENANCY_ENABLED=false`
  → usa o `DATABASE_URL` direto (o `novotributariodb`). O portal usa o **fallback**
  (`DEV_TENANT_SUBDOMAIN=dev`). Por isso funciona sem `PORTAL_TENANTS`.
- **Produção (vários clientes):** liga o multi-tenant, provisiona cada município e o
  portal os separa pelo `PORTAL_TENANTS`.

### Testar um município localmente — dois caminhos

1. **Instância separada (mais simples):** rode um tributário só do município com o
   `DATABASE_URL` apontando pro banco dele; no portal use `DEV_TENANT_SUBDOMAIN` /
   `TRIBUTARIO_BASE_URL` apontando pra ele.
2. **Multi-tenant de verdade (como produção):** `MULTITENANCY_ENABLED=true` +
   `tenant:provision --subdomain=paraguacu` + `PORTAL_TENANTS` com o Paraguaçu.

---

## 6. E se os dados vêm do sistema legado (GPE)?

Provisionar cria o banco **vazio**. Para trazer os dados reais (contribuintes,
imóveis, dívida ativa…), roda-se a **conversão do legado** para dentro do banco do
tenant — processo à parte (framework de migração por etapas). Esse é o passo de
**carga de dados**, feito **depois** do provisionamento.

---

## 7. Checklist para o Paraguaçu

- [ ] Tributário: `MULTITENANCY_ENABLED=true`, `REGISTRY_DATABASE_URL`,
      `TENANT_DATABASE_URL_TEMPLATE`, `PROXY_SHARED_SECRET`, `PORTAL_SERVICE_TOKEN`.
- [ ] `npm run tenant:provision -- --subdomain=paraguacu --name="Paraguaçu"` (anotar a senha do admin).
- [ ] (Se legado) rodar a conversão de dados para o banco do Paraguaçu.
- [ ] Portal: `PORTAL_TENANTS` com a entrada `paraguacu` (+ `baseUrls.tributario`).
- [ ] Portal: `PORTAL_SERVICE_TOKEN` e `PROXY_SHARED_SECRET` **iguais** aos do tributário; `PORTAL_SESSION_SECRET` definido.
- [ ] DNS: apontar `paraguacu.portal…` para o portal.
- [ ] Testar: acessar `paraguacu.portal…`, logar com um contribuinte real e conferir os débitos.
