# Oia — Product & Engineering Decision Log

**Project:** Oia (formerly NIA / NAIA — rename is now final)
**Domain:** heyoia.com
**Owner (CEO/Founder):** Ida · **CTO:** Claude
**Source PRD:** Oia — MVP Launch PRD v1.1 (3 July 2026)
**This log created:** 3 July 2026
**Status:** Living document — the source of truth we build against. Do not relitigate settled rows without a new decision.

> How to read this: every row is a **decision**, not a proposal. Rationale is included so we never re-argue it by accident. Open items are parked separately in §F.

---

## A. Product foundations

| # | Decision | Rationale |
|---|----------|-----------|
| A1 | **Build the conversation first.** The first thing we prove is a real patient talking to Oia and it feeling like a luxury concierge — before matching or negotiation. | It's the soul of the product. If Oia isn't the easiest, warmest place to bring a vulnerable question, nothing downstream matters. |
| A2 | **Web + WhatsApp from day one, one shared memory.** OpenClaw WhatsApp messages and web chat both write into the same patient record; Oia reads/writes one store across both. | One Oia, one memory. The channels are just two doors into the same conversation. |
| A3 | **Anonymous on web, link later.** A visitor can chat on the site with no phone number; histories are stitched together the moment they give a number or move to WhatsApp. | Never make someone hand over a number just to ask a nervous first question. |
| A4 | **Oia's character lives in an editable `soul.md`** that Ida controls — including the education-vs-advice line. Code just gives her a way to speak. | Personality shouldn't be buried in code only an engineer can touch. This is the "Training Lab" instinct made real. |
| A5 | **Medical-info boundary = "in between" (warm education, quick handoff), defined in `soul.md`.** She informs generally, never gives a personal recommendation, always defers suitability to the surgeon. | A patient who feels informed and unhurried is the whole luxury promise; the exact tuning belongs in `soul.md`, not hardcoded. |
| A6 | **Anti-hallucination grounding:** soft general knowledge is fine (what a procedure *is*, typical recovery), but **every price, clinic fact, or medical specific comes ONLY from Ida's controlled data.** If she doesn't have it, she says so warmly rather than inventing. | Only version that's both warm *and* safe. Oia is physically unable to invent a price or a clinic claim. |
| A7 | **Talk about anything, be honest about what's bookable today.** Oia engages with any cosmetic/aesthetic question (mole, botox, mommy-makeover timing), and logs interest in anything not yet bookable. | Being the approachable front door means never making someone feel silly for a "small" question. The unbookable-interest list becomes the roadmap of what to add next. |

---

## B. The cockpit (Ida's operating table)

| # | Decision | Rationale |
|---|----------|-----------|
| B1 | **One private Oia cockpit holding every patient AND every clinic.** At conversation end, a clean patient profile lands there; plus live visibility into chats; plus a WhatsApp ping to Ida when a patient is ready. Built summary-first, live-watching right after. | The cockpit is the true shape of the business — patients on one side, clinics on the other, negotiations between. The WhatsApp ping means Ida never misses a live patient while away from the screen. |
| B2 | **Clinic coordinators only ever experience Oia as WhatsApp.** No login, no accounts. Everything they send structures automatically into the cockpit. A coordinator portal is built only if/when clinics ask for one. | A clinic that has to learn a new system ghosts you. Meet coordinators where they already live. |

---

## C. The journey & negotiation gates

| # | Decision | Rationale |
|---|----------|-----------|
| C1 | **Ida approves every clinic outreach.** Oia drafts the anonymised profile + photos to each coordinator; Ida taps send. **Photo-sharing consent is captured in the conversation, and logged, BEFORE any photo leaves.** | At 5–10 patients, Ida's eyes on every outreach is the quality bar and the learning loop. Photos are health data — consent must precede sharing. |
| C2 | **Shortlist is always human-curated before it reaches the patient** and renders as real-quote cards *inside the conversation* (not a listings page). | Hard PRD gate. Real prices, chosen by Oia+Ida, presented conversationally. |
| C3 | **Patient picks who to pursue; Oia nudges honestly.** 2–3 clinic threads run in parallel; competition is **implied, never named, never lied about** (if a coordinator asks directly, Oia confirms truthfully). | It's the patient's face, body, money — they stay in control; an honest nudge is the concierge touch. |
| C4 | **Negotiation approval gate:** Oia haggles freely **within per-patient rails Ida sets** (e.g. don't exceed X, always get hotel). **Every number shown to the patient needs Ida's one-tap approval;** anything hitting a rail edge pings Ida. Price table acts as floor/ceiling safety net. | Approving every clinic counter would exhaust Ida and stall threads; the gate belongs exactly where the risk is — the patient-facing offer. Honours "no AI-committed patient price." |
| C5 | **Booking counts only on two-sided confirmation** (patient AND clinic). Oia chases the missing side. **Built so money can flow *through* Oia later** without a rebuild — the same booking record just gains a payment step. | North-star metric (paid, completed bookings) is too important to run on one side's word. Payments-through-Oia is the stated next evolution. |
| C6 | **ABSOLUTE hard rule — no cross-border travel booked without the operating surgeon's *written* suitability sign-off logged.** | The worst possible outcome is a patient who flew out, paid, and got turned away. The sign-off is cheap insurance and a trust differentiator. |
| C7 | **Oia luxury recovery packages: offered warmly in the chat, arranged by Ida's hand for the first patients;** productised (partners/pricing) later once real requests reveal what patients want. | Keeps the luxury promise real from patient one without sinking weeks into partner contracts before we know demand. Second revenue line. |
| C8 | **Post-op is never medical (cardinal rule).** Oia forwards anything medical to the clinic verbatim and chases. **Tiered escalation:** urgent-sounding reports ping Ida *immediately* (+ emergency-services-first script to the patient); ignored ordinary questions escalate to Ida after a short window. **Clinic medical-response SLA goes in every agreement.** | A frightened patient with a silent clinic is the moment most likely to become real harm and a reputational disaster. Nothing a clinic ignores may disappear. |
| C9 | **Results collection: layered, opt-in consent, NO perks attached.** Patient separately consents to (a) anonymous matching use, (b) public before/after, (c) named testimonial. **AI face-swap de-identifies body-procedure results** (breast, lipo, BBL, body) — NOT face procedures (rhino, facelift, eyes), where the face *is* the result. Feeds the SmartMatch portfolio flywheel. | Paid consent for health data can be ruled "not freely given" and poison the dataset. Face-swap removes the #1 reason patients decline (privacy) and makes body results safely usable. Every completed Oia booking becomes owned matching data — reduces dependence on clinic portfolios. |

---

## D. Growth

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Referral program — both sides rewarded.** Two mechanics: **(1) "Plan with a friend, both get 20% off"** — a discount on Oia's own service (zero compliance worry, strong viral pull); **(2) Revolut-style cashback** — tied to the referral/sign-up relationship and paid out of Oia's margin, framed/triggered so it never reads as *paying for a medical referral*. | Two friends planning together convert far better than one. Referral rewards are fine; the guardrail keeps the cashback clean of medical-inducement rules. |

---

## E. Always-on compliance guardrails (captured, must hold in every build)

- **Special-category health data** (photos + medical history): explicit consent at intake *before* any photo upload; encrypted storage; retention/deletion policy; DPIA before launch.
- **Quote-stage sharing:** consent must name the countries candidate clinics may be in and be captured before any photo is shared; share the minimum photo set needed to quote. Facial photos are identifiable even without a name — treat as pseudonymised, not anonymised.
- **No paid consent for health-data use** (invalidates consent) — see C9.
- **No cash *for medical referrals*** (inducement risk) — keep rewards as service discount / concierge credit, or frame cashback around the referral relationship — see D1.
- **UK CAP/ASA:** no guaranteed results, no trivialising surgery, no pressure/urgency/scarcity or time-limited offers. All before/after imagery gated behind the sensitive-imagery confirmation ("I understand — view images"). Prices always indicative until a clinic offer is approved and sent.
- **WhatsApp threads contain health data** — mirror records into the platform DB (system of record), never treat WhatsApp as the store of record.

---

## F. Open items (still to decide — from PRD §11 + this session)

1. **Match-live threshold** — is ≥2 vetted clinics per procedure per country right?
2. **Commission structure** — flat % vs tiered by procedure value; and is it in the clinic agreements yet?
3. **BBL in the launch five** — does it stay if its elevated vetting bar delays supply?
4. **Cancelled-on-arrival cost/refund policy** — who bears cost if surgeon cancels vs patient cancels; agree in clinic agreements.
5. **Luxury recovery packages** — contents, fulfilment partners, pricing, margin model. Own workstream (C7).
6. **Referral specifics** — exact cashback amount, 20%-off mechanics/limits, anti-abuse rules (D1).
7. **Suitability sign-off** — confirmed as hard rule (C6); still need the written form/flow with clinics and the medical-response SLA wording (C8).

---

## G. Existing build (context) & alignment actions

**Already built (Turborepo monorepo `nia-medtourism`, pnpm):**
- `packages/web` — patient Next.js chat (Claude Sonnet, streaming) · `packages/dashboard` — coordinator/admin · `packages/shared` — Prisma schema · `packages/shared-ui` — tokens · `packages/whatsapp` — OpenClaw (Oia's WhatsApp brain) · `agent`, `api` reserved.
- **Neon Postgres** (London) via Prisma · **Vercel** (web + dashboard) · **Vercel Blob** (patient photos) · **Claude** for intake · **OpenClaw** for WhatsApp.
- Much of the conversation slice (web + WhatsApp intake → one DB → lead pipeline, photo upload, triage) already exists under the NIA name.

**Alignment actions arising from this session:**
- [ ] **Rename NIA → Oia** across code, docs, deploys, env, and the OpenClaw workspace (separate workstream; name is final).
- [ ] **Remove Supabase** — `infra/supabase` exists and older `ARCHITECTURE.md` references it. Stack is **Neon only**. (User directive: no Supabase.)
- [ ] **No Twilio** — WhatsApp is OpenClaw; strip Twilio references from older docs/integration map. (User directive: no Twilio.)
- [ ] Point `soul.md` as the single source of Oia's character + boundaries (A4/A5), editable by Ida.
- [ ] Wire **grounding** (A6): price table + clinic facts as the only source for hard facts; refusal behaviour when unknown.
- [ ] Confirm **anonymous→phone-number linking** unifies web + WhatsApp histories (A3).
- [ ] Ensure **in-conversation, logged photo-sharing consent** precedes any clinic share (C1, E).
- [ ] Conversation-end → **clean profile into cockpit + WhatsApp ping to Ida** (B1).

---

## H. What we build first (next actions, in order)

Goal: a real patient talking to Oia end-to-end (the moment Ida chose as "this is real").

1. **`soul.md`** as the editable source of Oia's character + the education-vs-advice line.
2. **Grounded facts** — Oia cannot state a price or clinic fact except from Ida's data; warm refusal when unknown.
3. **Two doors, one memory** — align web + WhatsApp (OpenClaw) onto one patient record; anonymous on web, linked on phone number.
4. **Photo sharing with logged in-conversation consent.**
5. **Conversation end → clean profile in the cockpit + WhatsApp ping to Ida.**

**Stack (fixed):** GitHub + Vercel + Neon + Claude + OpenClaw. **No Supabase. No Twilio.**
Everything loosely coupled so today's conversation data still works when tomorrow's SmartMatch and negotiation plug in.
