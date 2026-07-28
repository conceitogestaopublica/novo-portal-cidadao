#!/usr/bin/env bash
#
# Builda a imagem da app LOCALMENTE (nunca no servidor — RAM apertada demais
# pra `npm ci` + build de produção sem risco de estourar) e transfere só a
# imagem final já pronta via `docker save`/`docker load` (sem precisar de
# registry). Depois disso, `./deploy.sh` no servidor só sobe o que já foi
# carregado — não builda nada.
#
# Uso:
#   ./transfer-image.sh
#
# Variáveis de ambiente (todas com default para este servidor):
#   SSH_KEY   (padrão: ~/Downloads/hml-container.pem)
#   SSH_HOST  (padrão: admin@56.126.67.26)
set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/Downloads/hml-container.pem}"
SSH_HOST="${SSH_HOST:-admin@56.126.67.26}"
PROJECT="novo-portal-cidadao"
IMAGE="${PROJECT}-app"
TARBALL="/tmp/${IMAGE}.tar.gz"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }

log "Build local da imagem"
docker compose build app

log "Salvando imagem em ${TARBALL}"
docker save "${IMAGE}:latest" | gzip > "$TARBALL"
du -h "$TARBALL"

log "Transferindo pro servidor (${SSH_HOST})"
scp -i "$SSH_KEY" "$TARBALL" "${SSH_HOST}:/tmp/"

log "Carregando a imagem no servidor"
ssh -i "$SSH_KEY" "$SSH_HOST" "gunzip -c /tmp/$(basename "$TARBALL") | docker load && rm -f /tmp/$(basename "$TARBALL")"

log "Limpando tarball local"
rm -f "$TARBALL"

log "Imagem transferida. Rode ./deploy.sh no servidor pra subir."
