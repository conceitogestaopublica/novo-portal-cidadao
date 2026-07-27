# Auth — duas sessões separadas

Diferente do ERP irmão (RBAC granular por permissão), este portal tem duas
sessões simples e independentes:

## Sessão do cidadão (`shared/lib/portal-session.ts`)

- Login por **documento + senha** (conta própria do portal, `PortalConta`) ou
  **documento + OTP** (resolve o contribuinte no tributário, emite um
  desafio, valida e emite o JWT CONTRIBUINTE).
- Cookie httpOnly assinado (HMAC), TTL de 8h — é a identidade durável.
- Senha com bcryptjs (`shared/repos/conta-repo.ts`) — só o admin (`PortalAdmin`)
  foi migrado para argon2 até aqui.
- O JWT CONTRIBUINTE do tributário (TTL 15min) é renovado **transparentemente**
  pelo BFF (`shared/adapters/portal-me-client.ts` → `ensureToken()`) usando o
  `contribuinteId` da própria sessão como prova de identidade — sem pedir OTP
  de novo a cada 15 minutos.
- Modelo "uma pessoa, várias empresas": a sessão guarda a lista de
  `representados` (titular + empresas que a pessoa representa) resolvida no
  login; trocar de identidade ativa (`POST /api/auth/atuar-como`) exige que o
  alvo esteja nessa lista (checagem rápida, mas pode ficar velha por até 8h) —
  e o **tributário revalida de novo** a cada emissão de token (login, "atuar
  como" e toda renovação silenciosa em `ensureToken`), comparando o
  `documento` fixo da sessão contra o vínculo vigente. Um vínculo revogado
  depois do login (ex.: contador perdeu acesso à empresa) é pego na próxima
  renovação, não só no próximo login.
- **Revogação por troca de senha**: `PortalConta.tokenVersion` é capturado na
  sessão no login e comparado a cada renovação em `ensureToken`. Trocar a
  senha (`consumirTokenETrocarSenha`) incrementa a versão — toda sessão aberta
  com a versão antiga é rejeitada (401) na próxima chamada fiscal, sem esperar
  o cookie expirar. Quem entrou só por OTP (sem `PortalConta`) não tem essa
  checagem — não há senha para revogar.

## Sessão do admin (`shared/lib/admin-session.ts`)

- Login por **e-mail + senha**, conta própria por pessoa (`PortalAdmin`,
  argon2) — substituiu a antiga senha única global (`PORTAL_ADMIN_SENHA`, hoje
  removida). Criação de admin via `npm run admin:criar` (script
  `prisma/scripts/criar-admin.mjs`), não há autocadastro.
- Cookie httpOnly assinado, TTL de 8h. Payload carrega `adminId` +
  `tokenVersion`; `getAdminSession()` revalida a versão contra o banco a cada
  chamada — trocar a senha ou `revogarSessoesAdmin()` invalida sessões abertas
  na hora, mesmo mecanismo do cidadão.
- `requireAdmin()` no topo de toda página/rota do admin — guard server-side,
  nunca só uma checagem client-side, redireciona para `/admin/entrar` se
  ausente.

## Lockout de força bruta (`shared/lib/login-lock.ts`)

Um único módulo, por `escopo`, cobre os dois logins por senha (não o OTP, que
já tem seu próprio limite de tentativas em `otp-store.ts`):

- **`admin`**: chave = e-mail informado — bloqueia a CONTA visada (cada admin
  agora tem a sua), não o IP de quem ataca.
- **`login-senha`**: chave = documento — mesma lógica, bloqueia a CONTA
  visada, não o IP.

5 tentativas erradas → bloqueio de 5 min. Estado persistido em
`PortalLoginTentativa` (Postgres) — sobrevive a restart/deploy e vale entre
instâncias, ao contrário de um `Map` em memória.

## Guard: como cada sessão é verificada de fato

**Admin**: guard de página de verdade (`requireAdmin()`, redireciona
server-side). Toda página/rota do admin chama isso no topo.

**Cidadão**: **não há** guard de página equivalente — os componentes de
`page.tsx` das áreas autenticadas (ex. `/fiscal/*`) são Server Components
finos, sem checagem de sessão. A fonte de verdade de segurança é o **BFF**: as
rotas `src/app/api/fiscal/*` e os adapters (`shared/adapters/*.ts`) exigem
sessão válida e devolvem 401 sem ela — quem não está logado nunca consegue
ler dado nenhum, mesmo acessando a URL direto. No cliente, os hooks React
Query recebem esse 401 e o componente confere `isSessaoExpirada(query.error)`
para renderizar `<SessaoExpirada />` (`components/common/`) em vez de tentar
mostrar a tela com dado ausente.

Isso é intencional (evita duplicar o guard em toda `page.tsx`), mas é
diferente do admin — não confundir os dois modelos ao criar uma página nova.
