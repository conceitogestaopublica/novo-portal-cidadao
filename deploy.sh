#!/usr/bin/env bash
#
# Deploy manual seguro do Portal do Cidadão (servidor). Mesmo padrão do
# deploy.sh do gpd-web-tributario-front, adaptado pra este projeto.
#
# O que ele garante:
#   - Projeto compose FIXO (-p novo-portal-cidadao).
#   - docker-compose.yml + override.local do servidor (redes gpecloud_edge e
#     do tributário — sem o override, a app não é alcançada pelo nginx
#     compartilhado nem alcança a API do tributário).
#   - git pull do repositório.
#   - Migrations aplicadas SEMPRE (db-init roda `prisma migrate deploy`,
#     idempotente).
#   - Health check em /api/health (processo + banco próprio — não depende do
#     tributário/GED/gpe2 estarem no ar).
#   - Tag da imagem atual como :previous e ROLLBACK automático se o health falhar.
#
# Uso:
#   ./deploy.sh              # pull + build + up + health + rollback-on-fail
#   ./deploy.sh --no-pull    # não faz git pull (deploy do código já presente)
#
# Pré-requisitos (uma vez, no servidor, nunca commitados):
#   .env (a partir de .env.example) e docker-compose.override.local.yml
#   (rede gpecloud_edge + gpd-web-tributario-front_internal como external).
set -euo pipefail

PROJECT="novo-portal-cidadao"
DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE=(docker compose -p "$PROJECT"
  -f "$DIR/docker-compose.yml"
  -f "$DIR/docker-compose.override.local.yml")
SERVICE="app"
IMAGE="${PROJECT}-${SERVICE}"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }
die() { echo -e "\n\033[1;31mERRO: $*\033[0m" >&2; exit 1; }

[ -f "$DIR/docker-compose.override.local.yml" ] || \
  die "Falta docker-compose.override.local.yml (redes gpecloud_edge + tributário)."
[ -f "$DIR/.env" ] || die "Falta $DIR/.env (ver .env.example)."

if [ "${1:-}" != "--no-pull" ]; then
  log "git pull"; git -C "$DIR" pull --ff-only origin master
fi

log "Marcando imagem atual como :previous (para rollback)"
if docker image inspect "${IMAGE}:latest" >/dev/null 2>&1; then
  docker tag "${IMAGE}:latest" "${IMAGE}:previous"
  echo "  ${IMAGE}:latest -> ${IMAGE}:previous"
else
  echo "  ${IMAGE}:latest ainda não existe (primeiro deploy) — sem rollback disponível"
fi

# db-init roda migrate deploy sempre, antes da app. build sempre local (nunca
# neste servidor — RAM apertada) e só a imagem final é transferida via
# ./transfer-image.sh; aqui só sobe o que já foi carregado (docker load).
log "Up (db-init aplica migrations; app aguarda health)"
"${COMPOSE[@]}" up -d "$SERVICE" || {
  echo "up falhou — tentando rollback"; ROLLBACK=1;
}

if [ "${ROLLBACK:-0}" != "1" ]; then
  log "Aguardando app ficar healthy (até ~120s)"
  ok=0
  for i in $(seq 1 40); do
    status=$("${COMPOSE[@]}" ps "$SERVICE" --format '{{.Health}}' 2>/dev/null || echo "")
    if [ "$status" = "healthy" ]; then ok=1; break; fi
    sleep 3
  done
  [ "$ok" = "1" ] || { echo "app não ficou healthy"; ROLLBACK=1; }
fi

if [ "${ROLLBACK:-0}" = "1" ]; then
  log "ROLLBACK — restaurando imagem :previous"
  if docker image inspect "${IMAGE}:previous" >/dev/null 2>&1; then
    docker tag "${IMAGE}:previous" "${IMAGE}:latest"
  fi
  "${COMPOSE[@]}" up -d "$SERVICE" || true
  "${COMPOSE[@]}" logs --tail=100 "$SERVICE" || true
  die "Deploy revertido para a versão anterior. Verifique os logs acima."
fi

log "Deploy OK"
"${COMPOSE[@]}" ps
