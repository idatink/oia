FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  jq \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Pin to 2026.6.11 — the clawhub WhatsApp plugin requires plugin API >=2026.6.11
RUN npm install -g openclaw@2026.6.11

WORKDIR /app

# Oia workspace (soul.md, identity, skills) — refreshed onto the volume each boot
COPY workspace ./workspace
# Cloned, path-fixed OpenClaw state (config + credentials + WhatsApp session + Anthropic cred)
COPY openclaw-seed ./openclaw-seed
# Real-time conversation syncer (sidecar: tails session files -> dashboard)
COPY sync ./sync
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# WhatsApp session + all state live on the mounted volume at /data
ENV OPENCLAW_STATE_DIR=/data

ENTRYPOINT ["/app/entrypoint.sh"]
