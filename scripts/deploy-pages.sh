#!/usr/bin/env bash
# Deploy static Just Run It site to Cloudflare Pages — NO browser OAuth / localhost callback.
#
# Prerequisites (one-time):
#   1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
#      Template: "Edit Cloudflare Workers" (includes Pages write)
#      Or custom: Account → Cloudflare Pages → Edit
#   2. Save the token locally (never commit it):
#        mkdir -p ~/.config/cloudflare
#        umask 077
#        printf '%s' 'YOUR_TOKEN' > ~/.config/cloudflare/api_token
#
# Usage:
#   ./scripts/deploy-pages.sh
#   PROJECT_NAME=justrunit ./scripts/deploy-pages.sh
#   CLOUDFLARE_API_TOKEN=... ./scripts/deploy-pages.sh   # env overrides file

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${PROJECT_NAME:-justrunit}"
TOKEN_FILE="${CLOUDFLARE_API_TOKEN_FILE:-$HOME/.config/cloudflare/api_token}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if [[ -f "$TOKEN_FILE" ]]; then
    export CLOUDFLARE_API_TOKEN
    CLOUDFLARE_API_TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
  else
    echo "No Cloudflare API token found."
    echo ""
    echo "Create one (no OAuth / no localhost):"
    echo "  https://dash.cloudflare.com/profile/api-tokens"
    echo "  → Create Token → \"Edit Cloudflare Workers\""
    echo ""
    echo "Then either:"
    echo "  export CLOUDFLARE_API_TOKEN='...'"
    echo "or:"
    echo "  mkdir -p ~/.config/cloudflare && umask 077"
    echo "  printf '%s' 'YOUR_TOKEN' > ~/.config/cloudflare/api_token"
    echo ""
    echo "Re-run: $0"
    exit 1
  fi
fi

echo "Checking auth (API token, no browser)..."
npx --yes wrangler@latest whoami

echo "Deploying $ROOT → Pages project '$PROJECT_NAME'..."
npx --yes wrangler@latest pages deploy . \
  --project-name="$PROJECT_NAME" \
  --commit-dirty=true \
  --branch=main

echo ""
echo "Done. Next (once): Dashboard → Workers & Pages → $PROJECT_NAME → Custom domains → justrunit.io"
echo "Or: npx wrangler pages domain add justrunit.io --project-name=$PROJECT_NAME"
