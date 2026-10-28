#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Installa Node.js LTS (versione 20 o successiva) e npm, quindi riprova." >&2
  exit 1
fi
if [[ ! -f .env ]]; then cp .env.example .env; echo "Creato .env da .env.example: controlla le credenziali prima di pubblicare."; fi
if [[ ! -d node_modules/express ]]; then npm install; fi
npm start
