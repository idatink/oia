# Intake Redesign — working spec (in progress)

Living capture of the web-intake redesign worked out step-by-step with Ida (started 2026-07-14).
Method: mock the intake conversation (Claude = Oia, Ida = patient); after each step log the
decision here, bucketed; implement in ONE batch once the whole flow is agreed; graduate locked
decisions into `DECISION_LOG.md`.

**Scope:** the WEB intake (`packages/web/src/app/api/chat/route.ts` → `SYSTEM_PROMPT`), which is
what produces matches today. NOT SOUL.md (that governs WhatsApp Oia, which is waitlist-only in
Phase 1). Flagged: Oia's voice is defined in two places (web SYSTEM_PROMPT vs whatsapp SOUL/AGENTS)
— decide later whether to unify.

---

## Architecture — one brain, both mouths (decided 2026-07-14)
**Key realisation:** Oia's identity/voice already live in the OpenClaw workspace .md files —
and `IDENTITY.md` ALREADY declares the local/abroad principle: *"at home or abroad… Local and
overseas are both always on the table. The patient chooses."* The WEB Oia is a separate
**hard-coded `SYSTEM_PROMPT`** that never reads those files, so it **drifted** from Oia's own
identity. This redesign is largely **realigning web to the .md brain**, not inventing new behaviour.

File roles:
- **SHARED CORE (surface-agnostic):** `IDENTITY.md` (who), `SOUL.md` (voice + vision), honesty/safety
  rules → promote to a location BOTH web + OpenClaw load.
- **PER-SURFACE OPERATING LAYER ("what's live now"):** `AGENTS.md` = WhatsApp (waitlist); new
  `INTAKE.md` = web (the streamlined flow). Analogous files, one per surface.
- **CAPABILITIES:** `skills/*/SKILL.md` (OpenClaw) are the canonical capability specs; each surface
  implements them its own way. Web control-tag map:
  `smart-match`/`get-clinic-recommendations` → `<CLINICS/>` + `/api/clinics` + finalize ·
  `match-room` → `/matches/<token>` · `upload-patient-photo` → `<PHOTOS>` Photo Guide ·
  `join-waitlist` → `<WAITLIST>` · `create-nia-inquiry` → `<INTAKE>` · `reset-patient` → TESTMODE.

**Payoff:** edit `IDENTITY.md`/`SOUL.md` once → web AND WhatsApp change together. This is the
[[project_nia_training_lab]] foundation (non-engineers tune Oia via .md, not code).

## Build plan (ordered)
1. **[STEP 1 — approved] Promote `IDENTITY.md` + `SOUL.md` to shared; make the web route LOAD
   them** — from here web can't diverge from Oia's identity again.
2. Add web **`INTAKE.md`** (streamlined flow + graceful degradation + honesty guards); web loads it
   in place of the hard-coded `SYSTEM_PROMPT` body.
3. Add **`locationPreference`** field: `<INTAKE>` schema + reconciler extraction + storage.
4. **SmartMatch country filter** branches on `locationPreference` (`PatientProfile` gains it) +
   update callers (`/api/clinics`, finalize-web, reconciler, match room).
5. **Graceful degradation**: 0 local → Oia says so honestly; never abroad-as-local.
6. **Grouped/filterable match view**; reconcile web-inline shortlist with the WhatsApp room.
7. **UK provider import** (fast-follow data: Notion master DB → Postgres).
8. **WhatsApp parity** (Phase 2, when intake moves to WhatsApp): `AGENTS.md` inherits shared flow.

---

## Problems this redesign fixes (Ida's observations, 2026-07-14)
1. **No local-vs-abroad question.** Medical tourism hinges on location preference, but the intake
   never asks it — everyone silently lands in "travel" mode.
2. **Web shows all-Turkish surgeons.** The web inline shortlist (top ~5 by accreditation) skews
   entirely Turkish. Not a ranking bug — Turkey has the most board-accredited surgeons in the table
   — but it should be a *choice* driven by (1), not a default.
3. **Web inline list ≠ WhatsApp match-room link.** Two surfaces show different results; the
   WhatsApp `/matches/<token>` room shows the full multi-country list (looks good, scrollable), the
   web chat shows a short skewed shortlist. Reconcile.
4. **Match room needs filtering + ordering** once there are many options (country, accreditation,
   later price).

---

## FINAL streamlined Phase-1 intake flow (locked 2026-07-14)
1. Procedure ("tummy tuck")
2. Brief confidence line + **local / travel / both**
3. Location (city + country) — needed for the local half
4. **Photos** (Photo Guide) — first, right after location
5. Age — one light question (suitability + under-18 gate)
6. Medical screening (11 conditions form) — safety
7. → match  (+ optional goal clarification AFTER photos, only if unclear)

Cut from Phase 1: goals-probing (photos carry it), timeline (→ Phase 2 availability match),
language (deferred).

## Decisions log (bucketed)

### Voice / flow  → web `SYSTEM_PROMPT` (later: SOUL.md + AGENTS.md for WhatsApp parity)
- **[DECIDED] After the patient names the procedure, keep it brief.** One warm, confident line
  ("that's a strong area for us — we work with a network of fully accredited surgeons who
  specialise in exactly this"), then immediately ask **local vs travel**. Do NOT launch into a long
  goals question first.
  - Honesty guard: confidence line must stay to claims we can stand behind — no named surgeon, no
    invented "incredible results" stats (per honest-claims rule).

### Voice / flow (cont.)
- **[DECIDED 2026-07-14] Scrap the detailed goals-probing questions** ("loose skin vs flatter
  tummy vs muscle tightening"). Not beneficial, adds friction — the **photos convey this**. If any
  goal clarification is needed at all, ask it **AFTER photos**, and only if something's unclear.
- **Principle emerging:** minimise upfront questions; let the **images carry the information**;
  clarify post-image only when needed. Every question must earn its place.

### Voice / flow (cont. 2)
- **[DECIDED 2026-07-14] Remove `timeline` AND `preferredLanguage` from the Phase-1 intake.**
  - `timeline` → **reintroduced in Phase 2**, not gone for good. Ida's plan: sell clinics **Oia
    dashboard access** (they run Oia agents across their business), which means Oia *knows clinic
    availability* → then match **patient timeline × clinic availability** (the availability match).
    Timeline also signals intent. Deferred only because there's no availability data to match against
    yet. (Aligns with SOUL.md's "availability × timeline × flights × budget × recovery".)
  - `preferredLanguage` → not necessary this phase; low priority; reintroduce later if needed
    (can be inferred from the patient's own writing).

### Data field  → `<INTAKE>` JSON schema + reconciler extraction + storage
- **[DECIDED] New field `locationPreference`** = `local` | `travel` | **`both`**. Captured right
  after procedure. Storage TBD (Consultation column vs lead metadata).
  - **`both`** added 2026-07-14 from Mia's answer ("happy to travel but want to see local too") —
    a real, common "compare" mindset the binary missed. `both` = open to travel AND wants local
    surfaced for comparison.
- **[DECIDED] When `local` or `both`, country of residence is required** to surface local options —
  ask "whereabouts are you based?" immediately after the travel question (captures
  `countryOfResidence` naturally).

### Matching logic  → `packages/shared/src/smartmatch.ts` + callers (/api/clinics, finalize-web, reconciler, match room)
- **[DECIDED] `locationPreference` drives the country filter** — the fix for "all-Turkish":
  - `local` → restrict SmartMatch to the patient's **country of residence only**.
  - `travel` → the **full accredited network** (current PILOT_COUNTRIES behaviour; leans TR
    because that's where vetted supply is).
  - `both` → residence country **and** the network, returned so the patient can **compare** —
    grouped by country / local-vs-abroad, not one flat list (see UI).
- `PatientProfile` gains `locationPreference`; smartMatch country logic branches on it.

### UI  → match-room page + `/api/clinics` + finalize
- **[OPEN → now REQUIRED] Filtering + ordering / group-by-country** on the match room. Elevated
  from nice-to-have: a `both` (compare) patient needs local-vs-abroad grouping or a country
  toggle, not one flat list.
- **[OPEN] Reconcile web-inline shortlist with the WhatsApp room** so both surfaces are consistent.

---

## ⚠️ HARD DEPENDENCY discovered 2026-07-14 — no UK supply
Provider table (active) = TR 45, ES 45, KR 30, GR 19, LT 6, **GB 0**. So the `local`/`both`
branch is **empty for UK patients** — the exact market Oia is aimed at (London). Also the root of
"web only shows Turkish": there is literally no UK supply, so a UK patient can only be shown abroad.
Before/alongside shipping local-vs-travel:
1. **Import UK providers** (pending backlog item — Notion master DB → Postgres), and/or
2. **Honest graceful degradation** — if 0 local options, Oia says so plainly and focuses on
   international; NEVER show abroad surgeons under a "local" heading.
**[DECIDED 2026-07-14] Do BOTH, in order: (1) graceful degradation FIRST** (Oia never shows
abroad-as-local; if 0 local, she says so honestly), **then (2) UK provider import.** Coupling note:
(1) needs the `locationPreference` field from this redesign to exist, so it ships inside the same
batch as the intake changes; (2) is the fast-follow data import right after.

## Open questions / forks
- If `local`: we need the patient's country to filter on (already collected as country of
  residence — confirm timing).
- If `open-to-travel`: optionally ask "anywhere in mind, or shall I show you the best options?"
  → a `preferredDestinations?` field.
- Should patient **goals** (free text) influence ranking at all? Today they're stored for the
  surgeon but unused by SmartMatch. TBD.

---

## Target files (implementation map, for the batch)
- Voice/flow: `packages/web/src/app/api/chat/route.ts` (`SYSTEM_PROMPT`, invited note, `<INTAKE>` block)
- Data: same `<INTAKE>` schema; `packages/dashboard/src/lib/reconcile-intake.ts` (extraction schema);
  storage (Prisma `Consultation`/`Lead` or metadata)
- Matching: `packages/shared/src/smartmatch.ts` (`PatientProfile`, country logic); callers
  `packages/web/src/app/api/clinics/route.ts`, `packages/dashboard/src/app/api/intake/finalize-web/route.ts`
- UI: web match-room (`packages/web/src/components/concierge/MatchRoomClient.tsx`), inline card path
- WhatsApp parity (later): `packages/whatsapp/workspace/SOUL.md`, `AGENTS.md`

_Status: walking the mock intake with Ida. Not yet implemented._
