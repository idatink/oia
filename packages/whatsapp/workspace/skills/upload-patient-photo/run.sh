#!/usr/bin/env bash
# Uploads a patient's photo by POSTing the bytes to the Nia dashboard, which stores
# it in the PRIVATE Blob store and returns a URL. Parsing uses jq (no python3 in the
# runtime image). The dashboard owns the Blob store, so no blob token is needed here.
set -euo pipefail

PAYLOAD=$(cat)
FILE_PATH=$(printf '%s' "$PAYLOAD" | jq -r '.filePath // ""')
SESSION_ID=$(printf '%s' "$PAYLOAD" | jq -r '.sessionId // "anon"')
MEDIA_TYPE=$(printf '%s' "$PAYLOAD" | jq -r '.mediaType // "image/jpeg"')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  echo '{"error":"file not found","url":null}'
  exit 0
fi

EXT="${FILE_PATH##*.}"
SAFE_SESSION=$(printf '%s' "$SESSION_ID" | tr -cd '[:alnum:]_-')
[ -z "$SAFE_SESSION" ] && SAFE_SESSION="anon"

RESPONSE=$(curl -s -X POST \
  "${NIA_API_URL}/api/intake/photo?sessionId=${SAFE_SESSION}&ext=${EXT}" \
  -H "Authorization: Bearer ${NIA_WHATSAPP_SECRET}" \
  -H "Content-Type: ${MEDIA_TYPE}" \
  --data-binary "@${FILE_PATH}")

URL=$(printf '%s' "$RESPONSE" | jq -r '.url // ""' 2>/dev/null || echo "")

if [ -z "$URL" ]; then
  ERR=$(printf '%s' "$RESPONSE" | jq -Rs '.' 2>/dev/null || echo '"unknown"')
  echo "{\"error\":\"upload failed\",\"response\":${ERR},\"url\":null}"
else
  echo "{\"url\":\"${URL}\"}"
fi
