# Oia — TRD Build Update · 2026-07-15

Companion to `SMARTMATCH_TRD.md` and `INTAKE_REDESIGN.md` (repo). Covers the build cycle 2026-07-12 → 2026-07-15.

## 1. System snapshot
- **Surfaces:** patient web app `@nia/web` (oia-web-eight.vercel.app) · admin dashboard `@nia/dashboard` (oia-dashboard-beryl.vercel.app) · WhatsApp via OpenClaw on Fly (`oia-whatsapp`, +447752991023) · shared logic in `@nia/shared` (Prisma, SmartMatch, tokens).
- **Models:** web + WhatsApp Oia locked to `openrouter/qwen/qwen3-vl-235b-a22b-instruct`. Claude Haiku used ONLY for the backend reconciler extraction. OpenRouter "oia" key has a **per-key** credit cap (raised $4 → $10 on 2026-07-15; per-key caps are separate from account balance — this caused a full WhatsApp outage misread as "no credits").
- **Phase 1 shape:** WhatsApp = waitlist + always-open line (no medical intake there). Full intake happens on web, entered via signed invite links after "Mark ready" on the dashboard.

## 2. Shipped this cycle

### 2.1 Editable conversational brain (Training-Lab foundation)
- Oia's web behaviour now lives in **Markdown, not code**: `packages/shared/src/oia/` (IDENTITY.md, SOUL.md, web-intake.md, README.md), bundled at build via a webpack asset/source rule. Editing the .md + redeploy changes Oia — no engineer needed.
- `web-intake.md` is split into **VOICE / FLOW / OUTPUT-CONTRACTS**; only the contracts section carries the parsed control tokens (`<TRIAGE/>`, `<PHOTOS>`, `<INTAKE>`, `<CLINICS/>`) — voice and flow are safe to edit freely.
- IDENTITY.md + SOUL.md promoted as byte-identical copies of the OpenClaw workspace versions. (Full single-brain unification pending; WhatsApp still reads its own copies — keep them mirrored.)

### 2.2 Redesigned web intake (designed live with Ida via mock intake)
Flow: procedure → brief honest confidence line + **local / travel / both** → city+country → **photos first** (Photo Guide) → age → 11-condition medical form → match.
Removed from Phase 1: goals-probing (photos carry it), timeline (returns in Phase 2 clinic-availability matching), preferred language (inferred).

### 2.3 Location-aware SmartMatch
- New `PatientProfile.locationPreference` (`local` | `travel` | `both`) drives the country filter: local → residence country only; travel/both → full network; unset → network (backwards-compatible).
- Empty local result returns `note='no_local_providers'` → honest graceful degradation in chat ("we don't have vetted surgeons in X yet") — **never abroad-as-local**.
- Colloquial procedure interpreter: per-token name matching + cluster patterns — "eye lift", "nose job", "boob job", "my nose is too big" all resolve to the right cluster. Regex boundary fixed so stems match full words (abdominoplasty, blepharoplasty, gynecomastia…).
- Field threaded end-to-end: `<INTAKE>` schema → reconciler extraction → finalize-web → `/api/clinics` → match token.

### 2.4 Deterministic match delivery
- Intake completion no longer depends on Qwen emitting `<INTAKE>`: the web finalizes when Photo Guide + triage are both submitted; the reconciler (Haiku) rescues the lead from the transcript if the model skipped the block.
- `finalize-web`: reconcile → SmartMatch → **returns the mapped surgeon cards** (persisted == displayed, no divergent second match call) → queues the WhatsApp match-room link.
- Match room `/matches/<token>`: **Local · <country> / Abroad / per-country filter chips**, defaults to the patient's stated preference, honest empty-local state; the signed token now carries locationPreference (old links still verify).

### 2.5 Provider data
- Active providers: TR 45 · ES 45 · KR 30 · GR 19 · LT 6 · **GB 16** (+1 held) = **161 active**.
- UK import 2026-07-14: 17 providers from Ida's list (script `packages/shared/uk-import.mjs`); Signature Clinic **held** (BBL vetting pending). CAVEAT: UK accreditations empty in the source → UK ranks bottom tier in the network view until FRCS(Plast)/BAAPS/BAPRAS data is added and the scorer is taught UK bodies.
- Ranking: accreditation 0.40 · specialism 0.35 · reviews 0.25 (+ small domestic bonus). Review data is sparse → accreditation dominates (why Turkey's FEBOPRAS surgeons top the network view).

### 2.6 Honesty hardening
- **Before/after gallery: fake stock photos removed.** The old widget showed Unsplash images captioned as surgical results behind a consent gate. New framework (`galleryData.ts`): consent-signed images only, anonymised captions, never clinic/surgeon names (UK CAP/ASA). While empty, Oia says so plainly and offers to request real clinic before/afters post-intake. Reminder task filed to add real images.
- Retired the "team will review in 24–48h" close on every surface; replaced with the active "let me find your surgeons" close.
- Photo Guide: procedure-specific angle slots (nose 5, tummy tuck 3, …) from a config table; photos stored angle-labelled (`left_profile-….jpg`) — surgeon-ready and future vision-training data.

### 2.7 Ops
- TESTMODE: patient texts TESTMODE → DB + OpenClaw conversation memory wiped deterministically (sidecar-driven).
- Invite-back loop live: waitlist → Mark ready → signed invite → full web intake, auto-registered from the token's phone (no re-asking for the number).
- WhatsApp channel relinked and healthy after the 2026-07-13/14 outage (root causes: per-key OpenRouter cap + Meta linked-device logout; long-term fix remains WhatsApp Business API in Phase 2).

## 3. Known issues (root-caused 2026-07-15)
1. **Qwen does not reliably fire tools/control tokens — it narrates instead of executing.** One root cause, three manifestations: `<INTAKE>` never emitted (fixed via deterministic finalize), `<TRIAGE/>` never emitted (medical form doesn't appear — **intake-blocking**), `join_waitlist` never called (patient "Paloma" told "you're on my list" with no record created).
2. **Sync sidecar can silently drop turns:** it advances its read-offset even when the dashboard POST fails, so conversations can permanently miss the dashboard — which also starves the reconciler safety nets (why Paloma's waitlist rescue never ran despite the signal phrase being covered).
3. Minor: "MMO" acronym unrecognised (recovered on clarification); procedure-slug normalisation (abdominoplasty vs mommy-makeover); IDENTITY/SOUL fold into the web compose pending (needs deliberate conflict resolution); web/WhatsApp voice unification pending.

## 4. In progress now
Make the deterministic paths authoritative instead of model-dependent:
(a) **sidecar**: only advance offsets on confirmed delivery + heartbeat logging;
(b) **TRIAGE net** (web `/api/chat`): show the medical form whenever Oia announces the medical step, token or not;
(c) **re-sync** dropped sessions (the intake endpoint de-dupes by messageId, so replay is safe).
The waitlist rescue (`looksWaitlisted` → `reconcileWaitlist`) already exists and fires once turns actually arrive.

## 5. References
- Repo docs: `INTAKE_REDESIGN.md` (living spec + build-plan status), `SMARTMATCH_TRD.md`, `DECISION_LOG.md`.
- Key commits: `fcf7f34` markdown brain · `15097f1` location-aware matching · `f755635` match-room grouping · `18bf57e` UK import · `d4450bd`/`0634dcc` honest gallery · `9676b5f` deterministic match delivery · `7ed1336`/`630d742` colloquial matcher · `176fc57` Photo Guide · `cf3ea2c` retired 24–48h close.
