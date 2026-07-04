#!/bin/sh
set -e

NIA_CONFIG='{"meta":{"lastTouchedVersion":"2026.6.10"},"gateway":{"port":3000,"mode":"local","bind":"loopback","auth":{"mode":"none"}}}'

# Write config to data dir (OPENCLAW_DATA_DIR)
if [ ! -f /data/openclaw.json ]; then
  echo "$NIA_CONFIG" > /data/openclaw.json
fi

# Also write to home dir (openclaw's default config location)
mkdir -p /root/.openclaw
if [ ! -f /root/.openclaw/openclaw.json ]; then
  echo "$NIA_CONFIG" > /root/.openclaw/openclaw.json
fi

exec openclaw gateway
