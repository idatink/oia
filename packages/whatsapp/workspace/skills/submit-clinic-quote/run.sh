#!/usr/bin/env bash
# Receives JSON payload via stdin from OpenClaw, POSTs it to the Nia clinic-quote API.
set -euo pipefail

PAYLOAD=$(cat)

curl -s -X POST "${NIA_API_URL}/api/intake/clinic-quote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NIA_WHATSAPP_SECRET}" \
  -d "${PAYLOAD}"
