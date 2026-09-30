#!/usr/bin/env bash
# Déploie le backend Entrix depuis le bare mirror vers /opt/entrix puis rebuild.
# Usage (VPS Entrix, user m2s) :
#   BRANCH=PROD ./scripts/deploy-prod-backend.sh
#   ./scripts/deploy-prod-backend.sh   # défaut PROD
set -euo pipefail

BRANCH="${BRANCH:-PROD}"
BARE_REPO="${BARE_REPO:-/home/m2s/entrix.git}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/entrix}"
WORK_DIR="${WORK_DIR:-/tmp/entrix-deploy-$$}"
REMOTE_NAME="${REMOTE_NAME:-}"

if [[ ! -d "$BARE_REPO" ]]; then
  echo "Bare repo introuvable: $BARE_REPO" >&2
  exit 1
fi
if [[ ! -f "$DEPLOY_DIR/docker-compose.prod.yml" ]]; then
  echo "Compose introuvable: $DEPLOY_DIR/docker-compose.prod.yml" >&2
  exit 1
fi

cd "$BARE_REPO"

echo "== remotes =="
git remote -v || true

# Choisir un remote si non fourni
if [[ -z "$REMOTE_NAME" ]]; then
  if git remote | grep -qx coconsult; then
    REMOTE_NAME=coconsult
  elif git remote | grep -qx origin; then
    REMOTE_NAME=origin
  elif git remote | grep -qx github; then
    REMOTE_NAME=github
  else
    echo "Aucun remote connu. Ajoute par ex.:" >&2
    echo "  git --git-dir=$BARE_REPO remote add coconsult https://github.com/co-consult/Entrix.git" >&2
    exit 1
  fi
fi

echo "== fetch $REMOTE_NAME =="
git fetch --prune "$REMOTE_NAME"

REF="$REMOTE_NAME/$BRANCH"
if ! git rev-parse --verify "$REF" >/dev/null 2>&1; then
  # bare parfois stocke refs/heads/PROD seulement
  if git rev-parse --verify "refs/heads/$BRANCH" >/dev/null 2>&1; then
    REF="refs/heads/$BRANCH"
  else
    echo "Branche introuvable: $REF" >&2
    git branch -a | head -40 >&2
    exit 1
  fi
fi

COMMIT=$(git rev-parse "$REF")
echo "== checkout $BRANCH @ $COMMIT =="
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
git --work-tree="$WORK_DIR" checkout -f "$COMMIT"

echo "== sync backend code → $DEPLOY_DIR/backend =="
# Ne touche PAS data/, backups/, .env, compose override
rsync -a --delete \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude 'uploads/' \
  --exclude 'logs/' \
  --exclude 'temp/' \
  --exclude 'cache/' \
  "$WORK_DIR/backend/" "$DEPLOY_DIR/backend/"

# Compose / docs optionnels (sans écraser env.production)
if [[ -f "$WORK_DIR/docker-compose.prod.yml" ]]; then
  cp "$WORK_DIR/docker-compose.prod.yml" "$DEPLOY_DIR/docker-compose.prod.yml"
fi

echo "== rebuild backend =="
cd "$DEPLOY_DIR"
sudo docker compose -f docker-compose.prod.yml up -d --build backend

echo "== health =="
sleep 5
sudo docker compose -f docker-compose.prod.yml ps backend
curl -sS -o /dev/null -w "health HTTP %{http_code}\n" http://127.0.0.1:3000/api/v1/health || true

rm -rf "$WORK_DIR"
echo "OK deploy $BRANCH ($COMMIT)"
