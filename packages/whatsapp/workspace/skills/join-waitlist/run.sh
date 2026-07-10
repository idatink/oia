#!/usr/bin/env bash
# Records a WhatsApp waitlist signup so it appears in Admin → Waitlist alongside
# the web signups. Receives {name, email, procedure, phone} via stdin.
set -euo pipefail
PAYLOAD=$(cat)
curl -s -X POST "${NIA_API_URL}/api/intake/waitlist" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NIA_WHATSAPP_SECRET}" \
  -d "${PAYLOAD}"
