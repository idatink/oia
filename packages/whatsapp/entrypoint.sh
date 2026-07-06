#!/bin/sh
set -e
export HOME=/root
STATE=/data
GLOBAL_OC="$(npm root -g)/openclaw"

# First boot only: seed the cloned state (config, credentials, WhatsApp session).
if [ ! -f "$STATE/openclaw.json" ]; then
  echo "[entrypoint] first boot — seeding OpenClaw state onto the volume"
  cp -a /app/openclaw-seed/. "$STATE/"
fi

# Ship latest config + workspace each deploy (credentials/session on volume persist).
cp -a /app/openclaw-seed/openclaw.json "$STATE/openclaw.json"
rm -rf "$STATE/workspace"; cp -a /app/workspace "$STATE/workspace"

# OpenClaw reads state from ~/.openclaw — point it at the persistent volume.
rm -rf /root/.openclaw
ln -s "$STATE" /root/.openclaw

# The plugin's node_modules/openclaw was a Mac-path symlink — re-point it at the
# container's global openclaw so the install safety-scan can realpath it.
ln -sfn "$GLOBAL_OC" /app/openclaw-seed/extensions/whatsapp/node_modules/openclaw

# Install the WhatsApp plugin from the OFFICIAL clawhub registry (signed) — required
# for openKeyedStore (the session key store) to trust it. Local-path installs are not
# trusted for that in this release. Runs once; the install persists on the volume.
if [ ! -f "$STATE/.wa-installed-6-11" ]; then
  echo "[entrypoint] installing WhatsApp plugin from clawhub (signed/trusted)…"
  rm -rf "$STATE/extensions/whatsapp"
  if yes 2>/dev/null | openclaw plugins install clawhub:@openclaw/whatsapp > /tmp/wa.log 2>&1; then
    grep -viE 'Config warning|duplicate plugin|plugin not found|stale config|last written' /tmp/wa.log | tail -10
    touch "$STATE/.wa-installed-6-11"
    echo "[entrypoint] WhatsApp plugin installed from clawhub."
  else
    echo "[entrypoint] clawhub install FAILED:"; grep -viE 'Config warning|last written' /tmp/wa.log | tail -10
  fi
fi

# Real-time conversation syncer: streams every WhatsApp turn to the dashboard so
# drop-off conversations are visible too. Runs alongside the gateway; if it dies
# it restarts itself, and it never blocks the gateway.
if [ -f /app/sync/oia-sync.js ]; then
  echo "[entrypoint] starting Oia real-time syncer…"
  ( while true; do node /app/sync/oia-sync.js; echo "[oia-sync] exited — restarting in 5s"; sleep 5; done ) &
fi

echo "[entrypoint] starting OpenClaw gateway (Oia)…"
exec openclaw gateway
