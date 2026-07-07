#!/usr/bin/env bash
# Runs SmartMatch for a patient and returns the ranked provider shortlist.
# Input: JSON (procedure, country, ageBand, concernTags, goalTags, limit) via stdin
set -euo pipefail

PAYLOAD=$(cat)

curl -s -X POST "${NIA_API_URL}/api/smartmatch" \
  -H "content-type: application/json" \
  -H "authorization: Bearer ${NIA_WHATSAPP_SECRET}" \
  --data "$PAYLOAD"
