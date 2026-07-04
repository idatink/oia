# NIA — Full User Journey

Companion to `ARCHITECTURE.md`. This document maps the **end-to-end journey for both
sides of the marketplace** — the **Patient** and the **Clinic** (coordinator + surgeon
roles) — and ties every step to the authoritative booking state machine defined in
`packages/shared/shard.md`.

Two parties drive one shared booking through one shared state. NIA is the connective
tissue: it triages intent, fetches context, and formats responses per surface (Web,
Dashboard, WhatsApp). The booking object is the single source of truth; both sides only
ever observe and advance the **same** `BookingState`.

**Legend**
- `BookingState` values reference `shard.md §1`.
- Transitions reference the matrix in `shard.md §3`; no step below invents a transition outside it.
- Preconditions reference the `PatientStateApplicability` schema (`shard.md §2`) and the precondition table (`shard.md §3`).
- Surfaces: **W** = patient web app, **D** = clinic dashboard, **WA** = WhatsApp, **API** = `@nia/api` BFF.

---

## 0. The Shared Spine

Every journey below moves one booking through this path. Patient actions and clinic
actions interleave on the same object — neither side owns the whole flow.

```text
        PATIENT                NIA / API                 CLINIC
        ───────                ─────────                 ──────
  DRAFT ─submit──────────────▶ SUBMITTED
                                   │  ◀──────────────── approve → CLINIC_APPROVED
                                   │  ◀──────────────── reject  → CLINIC_REJECTED
              AWAITING_DEPOSIT ◀───┤ (NIA, post-approval)
  pay ──────▶ DEPOSIT_PAID
              CONFIRMED ◀──────────┤ (travel window opens)
                                   │  ◀──────────────── start care → IN_TREATMENT
              COMPLETED ◀──────────┴──────────────────▶ COMPLETED  (both confirm)
```

Who may initiate what (`shard.md §4.2`):
- **Patient-initiated:** `DRAFT→SUBMITTED`, `DRAFT→CANCELLED`, `CANCELLED→REFUNDED`
- **Clinic-initiated:** approve/reject only, and only after `SUBMITTED`
- **System/NIA-initiated:** `SUBMITTED→CLINIC_REJECTED` (auto-decline rules), and the NIA-driven
  transitions into `AWAITING_DEPOSIT` and `CONFIRMED`

Every transition writes exactly one append-only row to `booking_state_history`
`{from, to, by: surface, by_user, ts}` (`shard.md §4.4`).

---

## PART A — Patient Journey

### A1. Discovery & First Contact  *(no booking yet)*

**Surfaces:** W (landing, concierge), WA (cold inbound)

The patient arrives via the marketing landing page or a WhatsApp message. There is no
booking object yet — this is lead and intent territory.

1. Patient lands on the patient web app and opens the NIA concierge (`/concierge`), or
   messages the WhatsApp number cold.
2. NIA's **Intent Router** triages the opening message — typically `GeneralConciergeAgent`
   for "I'm exploring," or `EligibilityAgent` / `SpecialistQAAgent` if they lead with a
   specific procedure or condition.
3. NIA opens an `NIASession` keyed by device (web) or WA number, and begins logging each
   exchange as an `NIAInteraction` (session memory lives in Postgres).
4. If the patient is unidentified, the **lead capture** path runs (`LeadCaptureModal` →
   `POST /api/leads`) to attach a contact to the session.

**Exit criteria:** patient has a session and a stated goal (a procedure, a destination, or
"help me figure it out"). Still **no booking**.

---

### A2. Explore & Compare  *(no booking yet)*

**Surfaces:** W (concierge + clinic cards), WA (text-formatted)

NIA helps the patient narrow toward a concrete procedure + clinic + destination.

1. Patient browses by **procedure**, by **destination/country**, or asks NIA in natural language.
2. NIA pulls catalogue context (`Procedure`, `Destination`, `Clinic`, `Specialist`) and,
   for travel questions, routes to `TravelPlannerAgent` (country, city, airport, hotel context).
3. Comparison is rendered surface-appropriately: rich `ClinicCard`s on web, condensed text
   on WhatsApp. The agent core stays surface-agnostic; **surface adapters** format the payload.
4. Specialist and procedure questions route to `SpecialistQAAgent`.

> ⚠️ Depends on the treatment catalogue and seed data being populated
> (`ARCHITECTURE.md` Critical TODOs / Known Gaps). Until `seed_procedures_countries.sql`
> and `seed_clinics_specialists.sql` carry real rows, this step runs on placeholder data.

**Exit criteria:** patient selects a target procedure + clinic. This is the moment a
**`DRAFT` booking** is created — owned and visible only by the patient (`shard.md §1`).

---

### A3. Eligibility & Document Pre-Screen  →  prepares `SUBMITTED`

**Surfaces:** W (forms + concierge), WA (read-only guidance)

A `DRAFT` cannot become `SUBMITTED` until two applicability fields are true
(`shard.md §3` precondition table):

| `PatientStateApplicability` field | What satisfies it |
|-----------------------------------|-------------------|
| `hasQualifyingProcedure`          | Medical-necessity pre-screen passed (`EligibilityAgent`) |
| `hasRequiredDocuments`            | Passport, medical history, signed consent uploaded (`Document`) |

1. NIA runs the **EligibilityAgent** pre-screen against the patient's stated condition + procedure.
2. Patient uploads required documents on web; each becomes a `Document` record. WhatsApp
   here is **read-only guidance** ("here's what's still missing") unless a message carries a
   signed one-time token tied to the booking id (`shard.md §4.3`).
3. Applicability is read fresh through `patientContextService.loadApplicability(patientId)` and
   is **not trusted from cache older than 30s** before a sensitive transition (`shard.md §2`).
   Missing fields **fail closed** (treated as `false`).

**Exit criteria:** both `hasQualifyingProcedure` and `hasRequiredDocuments` are `true`.

---

### A4. Submit the Booking  →  `DRAFT → SUBMITTED`

**Surfaces:** W (submit action) → API (transition guard), WA (status notify)

1. Patient submits. The **BFF transition guard** validates `DRAFT → SUBMITTED` against the
   matrix **and** re-checks the preconditions above with a forced applicability reload.
2. On pass: state becomes `SUBMITTED`, one row appended to `booking_state_history`
   `{from: DRAFT, to: SUBMITTED, by: web, ...}`.
3. NIA forwards the submission to the clinic side and emits a Pusher event so the clinic
   dashboard lights up in real time.
4. Patient sees "sent to clinic." Patient retains the right to `SUBMITTED → CANCELLED`.

**Hand-off:** control now sits with the **clinic** (see **Part B, B3**). The patient waits.

---

### A5. Clinic Decision Arrives  →  branches on `CLINIC_APPROVED` / `CLINIC_REJECTED`

**Surfaces:** W + WA (notify), driven by D + API

NIA relays the clinic's decision (made in **Part B**) back to the patient.

- **Approved** (`SUBMITTED → CLINIC_APPROVED`): NIA congratulates and, as a system-initiated
  step, advances `CLINIC_APPROVED → AWAITING_DEPOSIT`. Proceed to **A6**.
- **Rejected** (`SUBMITTED → CLINIC_REJECTED`): NIA explains and offers the two legal exits
  (`shard.md §3`):
  - **Resubmit** `CLINIC_REJECTED → SUBMITTED` (e.g., after addressing clinic feedback — new docs, different date), or
  - **Cancel** `CLINIC_REJECTED → CANCELLED`.

**Exit criteria:** booking is `AWAITING_DEPOSIT` (happy path) or resolved via resubmit/cancel.

---

### A6. Deposit & Escrow  →  `AWAITING_DEPOSIT → DEPOSIT_PAID`

**Surfaces:** W (Stripe checkout) → API (Stripe webhook → escrow), WA (receipt)

1. NIA presents the deposit. Patient pays via **Stripe escrow** (Stripe Connect / escrow deposits).
2. The Stripe webhook hits `@nia/api`; escrow confirmation sets `depositCleared = true`.
3. The guard for `AWAITING_DEPOSIT → DEPOSIT_PAID` requires **both** `depositCleared` **and**
   `clinicConfirmed` (`shard.md §3` precondition table). `clinicConfirmed` is already true
   since the clinic reached `CLINIC_APPROVED` or beyond.
4. State → `DEPOSIT_PAID`; history row appended; Pusher notifies the clinic.

> ⚠️ Stripe escrow wiring is an open gap (`ARCHITECTURE.md`: `webhooks/stripe.py`,
> "Payment escrow (Stripe Connect)"). Until wired, this step is stubbed.

**Exit criteria:** funds in escrow, booking `DEPOSIT_PAID`.

---

### A7. Confirmation & Travel Window  →  `DEPOSIT_PAID → CONFIRMED`

**Surfaces:** API (NIA-driven), W + WA (itinerary), `TravelPlannerAgent`

1. NIA advances `DEPOSIT_PAID → CONFIRMED`. The guard requires `travelWindowActive`
   (within booked arrival/departure dates) (`shard.md §3`).
2. `TravelPlannerAgent` assembles the trip context — flights/airport, hotel, city — and
   NIA surfaces the itinerary on web and WhatsApp.
3. Optional integrations attach here: travel insurance (Polly/TravelDoc), in-trip
   telemedicine standby (Air Doctor), specialist calendar hold (Google Calendar).
4. WhatsApp becomes the patient's day-to-day concierge for reminders and confirmations
   (still read-only on state unless carrying a signed token).

**Exit criteria:** trip confirmed; patient travels. Booking `CONFIRMED`.

---

### A8. Treatment  →  `CONFIRMED → IN_TREATMENT`

**Surfaces:** D (clinic marks start) → API, W + WA (status)

1. On arrival/check-in, the **clinic** marks the start of care (`CONFIRMED → IN_TREATMENT`,
   see **Part B, B5**). Guard requires `travelWindowActive` still true (`shard.md §3`).
2. NIA keeps the patient informed; `PatientSupportAgent` handles questions during care.
3. From any point up to here, `… → CANCELLED` remains reachable per the matrix (each of
   `SUBMITTED`, `CLINIC_APPROVED`, `AWAITING_DEPOSIT`, `DEPOSIT_PAID`, `CONFIRMED`,
   `IN_TREATMENT` can transition to `CANCELLED`).

**Exit criteria:** booking `IN_TREATMENT`.

---

### A9. Completion & Aftercare  →  `IN_TREATMENT → COMPLETED`

**Surfaces:** D + W (dual confirm) → API, WA (follow-up)

1. `COMPLETED` requires **both** clinic and patient to confirm (`shard.md §1`,
   "clinic + patient both confirm"). The clinic marks treatment done; the patient confirms.
2. State → `COMPLETED` — a **terminal** state (no outgoing transitions, `shard.md §3`).
3. Aftercare: NIA (`PatientSupportAgent`) handles recovery follow-up, telemedicine check-ins
   (Air Doctor), and any insurance claim generation (patient-facing — currently a Known Gap).

**Exit criteria:** journey complete.

---

### A10. Cancellation & Refund  *(off-ramp, reachable from most states)*

**Surfaces:** W/WA (request) → API (guard), D (notify)

1. `CANCELLED` is reachable from `DRAFT`, `SUBMITTED`, `CLINIC_APPROVED`, `CLINIC_REJECTED`,
   `AWAITING_DEPOSIT`, `DEPOSIT_PAID`, `CONFIRMED`, and `IN_TREATMENT` (`shard.md §3`).
2. Only the validated transition path may be used — no surface bypasses the guard (`shard.md §4.1`).
3. If money is in escrow, `CANCELLED → REFUNDED` runs. Precondition: `CANCELLED` first, then
   escrow disbursed (`shard.md §3`). `REFUNDED` is terminal.
4. `CANCELLED → REFUNDED` is a **patient-initiated** transition (`shard.md §4.2`).

---

## PART B — Clinic Journey

The clinic side has two roles (`ARCHITECTURE.md` RBAC): **coordinator** (operations,
booking triage) and **surgeon** (clinical decisions, marking care). Both act through the
clinic **Dashboard (D)**, enforced by the same API guard as the patient side.

### B1. Onboarding & Listing  *(no booking)*

**Surfaces:** D (onboarding wizard)

1. Clinic signs up; coordinator account created with the **coordinator** role (NextAuth.js,
   RBAC enforced at the API layer).
2. Coordinator builds the clinic profile: `Clinic`, its `Specialist`s, and the `Procedure`s
   offered per `Destination`, with pricing.
3. Surgeon accounts are added with the **surgeon** role.

> ⚠️ The clinic/specialist onboarding wizard is a Known Gap (`ARCHITECTURE.md`). Listings
> also depend on real catalogue seed data.

**Exit criteria:** clinic is live and discoverable in patient browse/compare (**A2**).

---

### B2. Availability & Calendar  *(no booking)*

**Surfaces:** D, Google Calendar integration

1. Coordinator/surgeon set availability windows; specialist availability syncs via
   **Google Calendar**.
2. This availability feeds NIA's `TravelPlannerAgent` and the patient-side scheduling so
   that submitted bookings target real open slots.

**Exit criteria:** bookable availability is published.

---

### B3. Receive & Review Submission  →  acts on `SUBMITTED`

**Surfaces:** D (real-time via Pusher) ← API ← patient **A4**

1. When a patient submits (**A4**), `@nia/api` emits a **Pusher** event; the coordinator's
   dashboard updates in real time with the new `SUBMITTED` booking.
2. Coordinator reviews patient context: procedure, eligibility result, and documents
   (passport, medical history, consent). The surgeon reviews clinical fit.
3. The clinic can **only** act on a booking that is already `SUBMITTED`, and can **only**
   approve or reject (`shard.md §4.2`).

**Exit criteria:** clinic ready to decide.

---

### B4. Approve or Reject  →  `SUBMITTED → CLINIC_APPROVED` / `CLINIC_REJECTED`

**Surfaces:** D (action) → API (guard) → patient **A5**

- **Approve** (`SUBMITTED → CLINIC_APPROVED`): coordinator/surgeon approve. This sets
  `clinicConfirmed = true` for downstream deposit logic. NIA then advances the booking to
  `AWAITING_DEPOSIT` (system-initiated). Patient is notified (**A5/A6**).
- **Reject** (`SUBMITTED → CLINIC_REJECTED`): clinic declines, optionally with feedback. The
  patient may resubmit (`CLINIC_REJECTED → SUBMITTED`) or cancel.
- **Auto-decline:** if auto-decline rules are active, the **system** may take
  `SUBMITTED → CLINIC_REJECTED` without manual action (`shard.md §4.2`).

Each decision appends one `booking_state_history` row with `by: dashboard` (or `system`).

**Exit criteria:** booking is `CLINIC_APPROVED` (→ deposit) or `CLINIC_REJECTED`.

---

### B5. Treatment Delivery  →  `CONFIRMED → IN_TREATMENT → COMPLETED`

**Surfaces:** D (surgeon/coordinator actions) → API, patient **A8/A9**

1. After the patient is `CONFIRMED` and has arrived, the clinic marks the **start of care**
   (`CONFIRMED → IN_TREATMENT`). Guard requires `travelWindowActive` (`shard.md §3`).
2. Surgeon delivers care; coordinator manages logistics. NIA's `PatientSupportAgent`
   handles the patient in parallel.
3. The clinic marks treatment **done**; combined with the patient's confirmation, the
   booking reaches `COMPLETED` (terminal) — `COMPLETED` needs **both** sides (`shard.md §1`).

**Exit criteria:** booking `COMPLETED`.

---

### B6. Post-Care, Outcomes & Insights  *(post-terminal)*

**Surfaces:** D (AI insights), API

1. Coordinator tracks outcomes; the dashboard surfaces **AI insights** (NIA tool agents).
2. Cancellations/refunds initiated on the patient side (**A10**) notify the clinic via Pusher;
   escrow disbursement on `CANCELLED → REFUNDED` reconciles against the clinic's records.

> ⚠️ ML pricing prediction and richer outcome analytics are Known Gaps (`ARCHITECTURE.md`).

---

## PART C — How the Two Sides Interlock

| Booking State      | Patient side (A)         | Clinic side (B)            | Who advances it                |
|--------------------|--------------------------|----------------------------|--------------------------------|
| `DRAFT`            | A2–A3 build & pre-screen | not visible to clinic      | Patient                        |
| `SUBMITTED`        | A4 submit, then waits    | B3 review                  | Patient (in), Clinic (out)     |
| `CLINIC_APPROVED`  | A5 notified              | B4 approve                 | Clinic                         |
| `CLINIC_REJECTED`  | A5 resubmit/cancel       | B4 reject (or system)      | Clinic / System                |
| `AWAITING_DEPOSIT` | A6 pay                   | waits                      | NIA (system)                   |
| `DEPOSIT_PAID`     | A6 paid                  | notified (Pusher)          | Patient pay + escrow           |
| `CONFIRMED`        | A7 travel                | B2 slot held               | NIA (system), needs travel win |
| `IN_TREATMENT`     | A8 in care               | B5 marks start             | Clinic                         |
| `COMPLETED`        | A9 confirms              | B5 marks done              | **Both** (dual confirm)        |
| `CANCELLED`        | A10 request              | B6 notified                | Per matrix initiator           |
| `REFUNDED`         | A10 refund               | B6 reconcile               | Patient                        |

**Invariants that hold across the whole journey:**
1. No surface bypasses the BFF transition guard; web, dashboard, and WhatsApp all call the
   same guard (`shard.md §4.1`).
2. Applicability is read fresh (<30s) and **fails closed** before any sensitive transition
   (`shard.md §2`).
3. WhatsApp is read-only on state unless a message carries a signed one-time token bound to
   the booking id (`shard.md §4.3`).
4. Every transition appends exactly one audit row; the log is append-only (`shard.md §4.4`).
5. NIA's agent core is surface-agnostic; only adapters format Web / Dashboard / WA output
   (`ARCHITECTURE.md`).

---

## Appendix — Open Dependencies Affecting the Journey

These items from `ARCHITECTURE.md` (Critical TODOs / Known Gaps / Integration Map) gate one
or more journey steps and are worth tracking as the build proceeds:

- Treatment catalogue + seed data (`seed_procedures_countries.sql`, `seed_clinics_specialists.sql`) — gates **A2, B1**.
- Clinic/specialist onboarding wizard — gates **B1**.
- Stripe escrow (Stripe Connect, `webhooks/stripe.py`) — gates **A6**.
- Twilio WhatsApp wiring (`webhooks/twilio.router`) — gates all **WA** touchpoints.
- Conversational component (`packages/web/lib/nia-chat.ts`) — gates **A1–A2** web concierge.
- Video consult telemedicine, patient-facing insurance claims, ML pricing, multi-language NIA — enrich **A7, A9, B6**.
