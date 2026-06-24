# Medical Tourism Platform — NIA Architecture

Dual-sided (Patient ↔ Clinic) medical tourism platform powered by a central AI agent ("NIA") operating across Web, Dashboard, and WhatsApp surfaces.

## Design Log

### Surface Types
1. **Patient-facing App** — browse countries, measure procedures, book appointments, NIA chat
2. **Clinic Dashboard** — manage listings, review appointments, AI insights
3. **WhatsApp** — NIA as conversational concierge, booking confirmation, reminders

### Key Flows
- PatientBrowse: search procedures → compare clinics → check eligibility → book
- ClinicManage: onboard listing → set availability → receive bookings → track outcomes
- NIAOrchestrate: triage intent → fetch context → generate surface-appropriate response → log interaction

### Critical TODOs
⚠️  **DO NOT use until population scripts are run.**  Seed data only;
  schema enforcement / FK constraints are expected to pass.
  TODO: seed_procedures_countries.sql — add real rows.
  TODO: seed_clinics_specialists.sql — add real rows.

---

## Architecture

```text
nia-medtourism/
├── packages/
│   ├── shared/            # @nia/shared — types, zod schemas, DB models, constants
│   ├── agent/             # @nia/agent  — NIA core: intent router + tool agents + memory
│   ├── api/               # @nia/api    — FastAPI backend (REST + WS)
│   ├── web/               # patient app  — Next.js + Tailwind
│   ├── dashboard/         # clinic panel  — Next.js + Tailwind
│   └── whatsapp/          # WA handler    — Fastify microservice
│
├── infra/
│   ├── docker-compose.yml
│   ├── postgres/
│   └── supabase/
│
├── .env.example
└── README.md
```

---

## Data Model (Prisma Schema)

See `packages/shared/prisma/schema.prisma`

Key entities:
- Patient, Clinic, Specialist, Procedure, Destination
- Booking, Document, Message, NIASession, NIAInteraction
- Country, City, Airport, Hotel (travel context)

### Sync Strategy
All surfaces write to the **same PostgreSQL database** (Vercel Postgres / Neon) via the @nia/api BFF.
Real-time push uses **Pusher** — the API emits events when coordinator-relevant state changes.
Webhooks from WhatsApp → @nia/api → Pusher broadcast → coordinator dashboard.

### State Layer
- Zustand (web/dashboard) for ephemeral UI state
- TanStack Query for server cache
- Pusher client (`pusher-js`) for real-time coordinator alerts

---

## NIA Agent Design

NIA is a multi-step reasoning agent:

```
User Input (any surface)
        │
        ▼
   Intent Router  ────  BookingFlowAgent
        │                   PatientSupportAgent
        ├──▶ EligibilityAgent   │ SpecialistQAAgent
        │                       │ TravelPlannerAgent
        ├──▶ GeneralConciergeAgent
        │
        ▼
   Surface Formatter ──── Web payload │ Dashboard payload │ WA message text
        │
        ▼
   Persist Interaction
   Broadcast (if real-time)
```

- Agent logic is **surface-agnostic** (no web/dashboard/wa imports inside)
- Surface adapters translate agent output → correct format
- Session memory in Postgres (NIASession + NIAInteraction), indexed by device/wa number

---

## Security

- Auth: NextAuth.js v5 (JWT sessions, credentials + OAuth)
- RBAC: patient, coordinator, surgeon roles enforced at API layer
- WhatsApp → provider-verified webhook signature (pluggable per provider)
- PII fields encrypted at rest (pgcrypto)
- No PII in URL params or logs

---

## Deployment

| Surface       | Host            | Notes                                  |
|---------------|-----------------|----------------------------------------|
| @nia/api      | Vercel          | Next.js API routes or separate service |
| @nia/web      | Vercel          | patient app, edge where possible       |
| @nia/dashboard| Vercel          | auth-gated CNAME                       |
| @nia/whatsapp | Railway / Fly   | needs static IP for webhook signature  |
| Database      | Vercel Postgres | Neon-backed, pooled connection         |
| CI/CD         | GitHub Actions  | test → build → deploy on merge to main |

---

## Integration Map

| Partner        | Integration Point                 |
|----------------|-----------------------------------|
| Twilio         | WA inbound / outbound             |
| Stripe         | escrow deposits                   |
| Google Calendar| specialist availability           |
| Polly/TravelDoc | travel insurance                  |
| Air Doctor     | in-trip telemedicine              |

TODO: @nia/api/webhooks/twilio.router → wire WA
TODO: @nia/api/webhooks/stripe.py → hook escrow triggers
TODO: packages/web/lib/nia-chat.ts → conversational component

---

## Colour / Design Tokens

From PRD §7.1 — implemented in `packages/shared-ui/src/tokens.ts` and extended via Tailwind:
- brand-terracotta:    #C86446
- brand-warm-bone:     #F9F6F0
- brand-peach:         #FCECE5
- brand-deep-charcoal: #2C2A29

Input focus: `ring-1 ring-brand-terracotta` (use `ring` not `border` — avoids layout shift)
Card shadow: ambient low-opacity (`shadow-card` token)
AI overlay: `backdrop-blur-md bg-white/70` over peach background layer

---

## Known Gaps

- [ ] Actual treatment catalogue (procedures + costs per destination)
- [ ] Clinic/specialist onboarding wizard
- [ ] Payment escrow (Stripe Connect)
- [ ] Video consult telemedicine (Daily / Zoom native)
- [ ] Insurance claim generation (patient-facing)
- [ ] ML pricing prediction (NIA tool agent)
- [ ] Multi-language NIA (EN default, add AR/ES/FR)
