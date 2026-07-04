#!/usr/bin/env bash
# Receives JSON payload via stdin from OpenClaw, POSTs it to the Nia intake API.
set -euo pipefail

PAYLOAD=$(cat)

curl -s -X POST "${NIA_API_URL}/api/intake/whatsapp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NIA_WHATSAPP_SECRET}" \
  -d "${PAYLOAD}"
