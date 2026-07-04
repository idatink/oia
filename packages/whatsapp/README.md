# Nia WhatsApp Gateway

OpenClaw-based WhatsApp intake for Nia. Patients message your personal WhatsApp number → Nia AI collects their intake info → lead appears in `/admin/inquiries`.

## Quick start (local / personal Mac)

### 1. Install OpenClaw
```bash
npm install -g openclaw@latest
openclaw onboard
# Paste your Anthropic API key when prompted
```

### 2. Set env vars
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export NIA_API_URL="https://nia-medtourism-dashboard.vercel.app"
export NIA_WHATSAPP_SECRET="c4292f6b11be8a5ca63007d159fbe756200a6558dfde6124f2db1c5d8a858069"
```

### 3. Connect your WhatsApp number
```bash
cd packages/whatsapp
openclaw channel add whatsapp
# A QR code will appear — scan it with your phone via WhatsApp > Linked Devices > Link a Device
```

### 4. Start the gateway
```bash
openclaw gateway --config ./openclaw.json
```

Now anyone who messages your WhatsApp number will be chatting with Nia. Completed intakes appear in https://nia-medtourism-dashboard.vercel.app/admin/inquiries.

---

## Persistent deployment (Fly.io)

For production use you need a server that runs 24/7 and can survive WhatsApp session reconnects.

### Prerequisites
```bash
brew install flyctl
fly auth login
```

### Deploy
```bash
cd packages/whatsapp
fly launch --name nia-whatsapp-gateway --region lhr --no-deploy
fly secrets set \
  ANTHROPIC_API_KEY="sk-ant-..." \
  NIA_WHATSAPP_SECRET="c4292f6b11be8a5ca63007d159fbe756200a6558dfde6124f2db1c5d8a858069"
fly volumes create openclaw_data --region lhr --size 1
fly deploy
```

### Scan QR code (first time only)
```bash
fly logs --tail  # watch for the QR code to appear
# Scan with WhatsApp > Linked Devices > Link a Device
```

The WhatsApp session credentials are persisted in the Fly.io volume (`/data/credentials`) so you only need to scan once.

---

## How it works

```
Patient messages your WhatsApp
        ↓
OpenClaw (Baileys/WhatsApp Web protocol)
        ↓
Claude claude-sonnet-4-6 as Nia (SOUL.md)
        ↓
Nia collects: name, procedure, DOB, country, language, medical screening
        ↓
create_nia_inquiry skill → POST /api/intake/whatsapp
        ↓
Patient profile + NIASession created in Nia DB
        ↓
/admin/inquiries shows the lead → click "Convert to Lead →" → /admin/intake
```

## Files

| File | Purpose |
|------|---------|
| `openclaw.json` | OpenClaw config: LLM, WhatsApp channel, skill refs |
| `workspace/SOUL.md` | Nia's AI persona and intake conversation guide |
| `workspace/skills/create-nia-inquiry/SKILL.md` | Tool definition (parameters, description) |
| `workspace/skills/create-nia-inquiry/run.sh` | Shell script that POSTs to the Nia API |
| `Dockerfile` | For Fly.io deployment |
| `fly.toml` | Fly.io app config |

## WHATSAPP_INTAKE_SECRET

The secret is already set on Vercel. Save it somewhere safe:
```
c4292f6b11be8a5ca63007d159fbe756200a6558dfde6124f2db1c5d8a858069
```
