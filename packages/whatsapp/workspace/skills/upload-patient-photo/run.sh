#!/usr/bin/env bash
# Uploads a local media file to Vercel Blob and returns the URL as JSON.
set -euo pipefail

PAYLOAD=$(cat)
FILE_PATH=$(echo "$PAYLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin).get('filePath',''))")
SESSION_ID=$(echo "$PAYLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessionId','anon'))")
MEDIA_TYPE=$(echo "$PAYLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mediaType','image/jpeg'))")

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  echo '{"error":"file not found","url":null}'
  exit 0
fi

EXT="${FILE_PATH##*.}"
TIMESTAMP=$(date +%s%3N)
PATHNAME="patient-photos/${SESSION_ID}/${TIMESTAMP}.${EXT}"

RESPONSE=$(curl -s -X PUT \
  "https://blob.vercel-storage.com/${PATHNAME}" \
  -H "Authorization: Bearer ${BLOB_READ_WRITE_TOKEN}" \
  -H "Content-Type: ${MEDIA_TYPE}" \
  -H "x-api-version: 7" \
  -H "x-content-type: ${MEDIA_TYPE}" \
  --data-binary "@${FILE_PATH}")

URL=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url',''))" 2>/dev/null || echo "")

if [ -z "$URL" ]; then
  echo "{\"error\":\"upload failed\",\"response\":$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '\"unknown\"'),\"url\":null}"
else
  echo "{\"url\":\"${URL}\"}"
fi
