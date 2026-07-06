#!/usr/bin/env bash
# Uploads a local media file to Vercel Blob and returns the URL as JSON.
# Uses jq for JSON parsing — the runtime image (node:22-slim) has no python3.
set -euo pipefail

PAYLOAD=$(cat)
FILE_PATH=$(printf '%s' "$PAYLOAD" | jq -r '.filePath // ""')
SESSION_ID=$(printf '%s' "$PAYLOAD" | jq -r '.sessionId // "anon"')
MEDIA_TYPE=$(printf '%s' "$PAYLOAD" | jq -r '.mediaType // "image/jpeg"')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  echo '{"error":"file not found","url":null}'
  exit 0
fi

if [ -z "${BLOB_READ_WRITE_TOKEN:-}" ]; then
  echo '{"error":"BLOB_READ_WRITE_TOKEN not set","url":null}'
  exit 0
fi

EXT="${FILE_PATH##*.}"
TIMESTAMP=$(date +%s%3N)
# Sanitise the session id for use inside the blob pathname (drop +, spaces, etc.)
SAFE_SESSION=$(printf '%s' "$SESSION_ID" | tr -cd '[:alnum:]_-')
[ -z "$SAFE_SESSION" ] && SAFE_SESSION="anon"
PATHNAME="patient-photos/${SAFE_SESSION}/${TIMESTAMP}.${EXT}"

RESPONSE=$(curl -s -X PUT \
  "https://blob.vercel-storage.com/${PATHNAME}" \
  -H "Authorization: Bearer ${BLOB_READ_WRITE_TOKEN}" \
  -H "x-api-version: 7" \
  -H "x-content-type: ${MEDIA_TYPE}" \
  --data-binary "@${FILE_PATH}")

URL=$(printf '%s' "$RESPONSE" | jq -r '.url // ""' 2>/dev/null || echo "")

if [ -z "$URL" ]; then
  ERR=$(printf '%s' "$RESPONSE" | jq -Rs '.' 2>/dev/null || echo '"unknown"')
  echo "{\"error\":\"upload failed\",\"response\":${ERR},\"url\":null}"
else
  echo "{\"url\":\"${URL}\"}"
fi
