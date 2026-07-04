#!/usr/bin/env bash
# Fetches clinic recommendations from the Nia web API for a given procedure.
# Input: JSON with "procedure" field via stdin
set -euo pipefail

PAYLOAD=$(cat)
PROCEDURE=$(echo "$PAYLOAD" | jq -r '.procedure // ""')

# URL-encode the procedure using jq
ENCODED=$(printf '%s' "$PROCEDURE" | jq -sRr @uri)

curl -s "${NIA_WEB_URL}/api/clinics?procedure=${ENCODED}"
