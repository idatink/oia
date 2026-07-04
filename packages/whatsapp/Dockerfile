FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g openclaw@latest

WORKDIR /app

COPY openclaw.json ./
COPY workspace ./workspace
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# WhatsApp session credentials are stored here — mount a persistent volume
RUN mkdir -p /data/credentials
ENV OPENCLAW_DATA_DIR=/data

ENTRYPOINT ["/app/entrypoint.sh"]
