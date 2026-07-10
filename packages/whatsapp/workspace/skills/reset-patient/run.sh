#!/usr/bin/env bash
# TEST-ONLY. Wipes everything stored for a WhatsApp number (patient, sessions,
# messages, matches, inquiry) so a fresh test can run cleanly from the same phone.
# Receives {phone} via stdin. Returns {"ok":true,...} on success.
set -euo pipefail
PAYLOAD=$(cat)
curl -s -X POST "${NIA_API_URL}/api/intake/reset" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NIA_WHATSAPP_SECRET}" \
  -d "${PAYLOAD}"
