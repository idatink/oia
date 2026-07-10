#!/usr/bin/env bash
# Mints a private "match room" link for a patient who wants to browse ALL her
# matches / other countries — the visual surface chat is bad at. Receives a JSON
# payload {procedure, name?} via stdin, returns the shareable URL to send her.
set -euo pipefail

PAYLOAD=$(cat)
PROC=$(printf '%s' "$PAYLOAD" | jq -r '.procedure // "" | @uri')
NAME=$(printf '%s' "$PAYLOAD" | jq -r '.name // "" | @uri')

if [ -z "$PROC" ]; then
  echo '{"error":"procedure is required"}'
  exit 0
fi

curl -s "${NIA_WEB_URL}/api/match-room?procedure=${PROC}&name=${NAME}"
