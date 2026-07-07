# SmartMatch — Technical Requirements Document (TRD)

**Version:** 0.1 (draft) · **Date:** 2026-07-07 · **Status:** For CEO sign-off
**Owner:** Engineering (CTO) · **Product owner:** Ida (CEO)
**Source:** CEO interview, 2026-07-07. Every "Decision" below was confirmed by the CEO in that interview. Items marked **[PROPOSAL]** are engineering proposals that still need sign-off.

---

## 1. Purpose & Scope

**SmartMatch** takes a completed patient intake and returns the **best-fit provider(s)** — an accredited surgeon matched to the patient's goals, anatomy, budget, location and timeline — and hands them to the patient automatically.

It sits here in the journey:

```
Intake / triage (EXISTS) → SmartMatch (THIS TRD) → Match & Price / negotiation (partly exists) → Trip → Recovery
```

**Pilot scope (Decision):**
- **2 countries: UK + Turkey.** Target **UK & Turkish patients**, matched to **UK & Turkish surgeons/clinics**.
- Deliberately limited patients — "full attention on each one."

**Non-goals for the pilot:**
- No live flight/logistics calculation engine (trip is assembled manually by the team — see §6).
- No ML/embedding matching (see §5 — deterministic and explainable by design).
- No standing/locked clinic prices (Phase 1 negotiates per-patient, manually — see §8).

---

## 2. Glossary

- **Provider** — a surgeon + their own clinic, **almost always 1:1** (a doctor's name *is* the clinic). The unit a patient is matched to.
- **Treatments cluster** — the catalogue of procedures and their sub-techniques.
- **Master tag vocabulary** — the shared controlled enums (concerns, severity, age bands, goals, techniques) that patient, treatments and providers all draw from. *The thing that makes tag comparison possible.*
- **Interpret** — Oia converting a patient's words + photo + intake fields into a tagged profile.
- **Filter → Score** — the two-stage matching engine (hard eligibility filters, then weighted ranking).
- **Portfolio similarity** — tag overlap between the patient and a provider's before/after cases (Option A — no biometric matching).
- **Safety floor** — the minimum accreditation a provider must hold + be human-verified to be matchable.

---

## 3. Data Model

Two **separate** clusters, each with its **own DB tables** and its **own admin dashboard section**. Both must be **typed/structured** (not free text) so a machine — you now, a curation AI later — can maintain them safely.

### 3.1 Master Tag Vocabulary — **BUILD ITEM #1**
The shared controlled enums. Nothing matches without this. Authored per body area. Illustrative (face):
- `concern`: `jowls, midface_descent, nasolabial_folds, marionette_lines, platysmal_bands, submental_fullness, skin_laxity, tired_appearance, volume_loss, hooded_eyelids, dorsal_hump, …`
- `severity`: `mild | moderate | severe`
- `ageBand`: `<35 | 35-44 | 45-54 | 55-64 | 65+`
- `goal`: `natural | subtle | refreshed | dramatic`
- `techniqueId`: enumerated in the Treatments cluster (§3.2)

> **[PROPOSAL]** Engineering drafts the full vocabulary from domain knowledge + research; CEO refines/prunes.

### 3.2 Treatments cluster (two-tier: procedure → technique)
Each **technique** record:
```
techniqueId, procedure (parent), displayName,
treats: [concern…],              # which concerns it addresses
indicatedSeverity: [severity…],
ageSuitability: [ageBand…],
goalFit: [goal…],
notFor: [tag…],                  # contraindication / wrong-tool tags
description, patientFacingSummary
```
Frequently updated (new technologies). Authored by CEO now, curation AI later.

> **[PROPOSAL]** Engineering drafts the initial two-tier taxonomy; CEO prunes to pilot scope.

### 3.3 Providers cluster (surgeon-centric, clinic embedded)
```
providerId, surgeonName, clinicName (optional), city, country,
accreditations: [ISAPS | EBOPRAS | GMC | TPRECD | MoH | …],
verified: boolean,               # safety floor flag — human-set (§4)
techniques: [ { techniqueId, yearsExp, caseVolume, subtypes[] } ],
beforeAfterCases: [ { technique, concern[], severity, ageBand, goal, rightsToShow:boolean } ],
reviews: { count, sources[] },
languages: [], coordinatorWhatsApp,   # WhatsApp is INTERNAL (§8)
priceList: optional,             # some doctors only
agreedOiaRate: null (Phase 2)
```
A genuine multi-surgeon clinic = the rare exception → several providers sharing clinic attributes.

### 3.4 Relationships
`Provider —offers→ Technique —belongsTo→ Procedure`. `Provider —has→ BeforeAfterCase —taggedWith→ vocabulary`. Patient profile (§5.1) is tagged from the same vocabulary.

---

## 4. Data Sourcing & Maintenance

**Pipeline (Decision):**
```
Paste provider URL → LLM extracts a structured draft record → human verifies/corrects → publish to cluster
```
Validated against `mirzafirat.com`: name, location, accreditations, techniques, languages, contact, reviews-source and experience signals all extract cleanly. **Price and availability do NOT appear on provider sites** → they are **not** hard filters; confirmed at negotiation (§8).

- **Phase 1:** CEO supplies the UK + Turkey clinic URL list; engineering extracts/categorizes/tags into the cluster; CEO verifies (flips `verified`).
- **Phase 2:** a curation AI runs the same pipeline continuously.

**Safety floor (Decision):** to enter the pool a provider must hold **recognised national specialist board certification** — UK: GMC specialist register (plastic surgery); Turkey: **TPRECD** + Ministry of Health licence — **or ISAPS/EBOPRAS**. Extracted data is a *draft*; a human checks the registry and sets `verified`. **Only `verified` providers are matchable.**

**Honesty:** everything on a provider's own site is self-reported marketing. Oia may only repeat a specific credential/number once it is verified (ties to SOUL "never fabricate" + UK CAP/ASA).

---

## 5. Matching Logic — the engine

**Design (Decision): deterministic, explainable, config-tunable — NOT ML/embeddings.** Rationale: auditable (every recommendation is a transparent breakdown — essential for a medical decision), works with a tiny provider pool (no training data), and every weight is a config value tunable without code (the training-lab vision).

### 5.1 Stage 0 — Interpret (patient → tagged profile)
Three input sources → one tagged profile (all tags from the master vocabulary):
- **Her words** → `concern[]`, `goal[]`
- **Her photo** → derived `severity`/anatomy tags — **Option A: Oia proposes, human confirms** (§7). No biometric matching.
- **Intake fields** → `ageBand`, `region`, `budget`, `timeline`, medical screening

### 5.2 Stage B — Interpret → technique (patient tags ∩ treatment `treats` tags)
Score each technique by concern overlap + severity + age suitability → **candidate technique set** (primary + secondary). This is a **matching hint; the surgeon confirms what's achievable.**

### 5.3 Stage 1 — Hard filters (eligibility gate — IN or OUT)
- Offers a candidate technique
- Serves a pilot country (**domestic-first; cross-border opens when domestic price exceeds budget**)
- `verified` = true (safety floor)
- Budget-plausible (soft signal from country averages / any price list — **firmed at negotiation, never a day-one hard cutoff**)

### 5.4 Stage 2 — Weighted score (rank the survivors 0–100)
Ranking hierarchy (Decision): **safety/experience → portfolio fit → value → convenience.** Weights are config values:

| Factor | Weight |
|---|---|
| Technique experience (years, case volume) | 0.35 |
| **Portfolio tag-similarity** (patient tags vs provider before/after case tags) | 0.30 |
| Reviews (count, source diversity) | 0.15 |
| Accreditation strength (above the floor) | 0.10 |
| Value within budget (best value, never "cheapest") | 0.10 |

> **[PROPOSAL]** Exact weights above are a starting point for tuning.

### 5.5 Worked example — Sarah × Dr Mirza Fırat
*Sarah, 54, London, "jowls + tired heavy midface," £10k.*

**Interpret →** `{ concern:[jowls, midface_descent, tired_appearance], severity:moderate, ageBand:45-54, goal:[natural, refreshed], region:UK, budget:10000 }`

**Interpret→technique:** Deep-Plane (3/3 concerns, severity+age fit) = **0.95**; SMAS (misses midface) = 0.60; MiniLift dropped. → candidates `[deep_plane, smas]`.

**Filter:** UK deep-plane (~£15–20k) > £10k → **cross-border opens** → Turkey providers stay. Eligible: `[Mirza Fırat, +2]`.

**Score (Mirza):** experience 1.00×0.35 + portfolio 0.90×0.30 (12 of 40 cases match her jowls+midface/moderate/45-64 profile) + reviews 0.80×0.15 + accreditation 1.00×0.10 + value 1.00×0.10 = **0.94 → rank #1.**

---

## 6. Runtime Flow (Phase 1)

**No team review of the match (Decision): full auto-send from day one.** The match is instant; the *price* follows a manual negotiation.

```
① Intake (Oia, auto — exists)
② SmartMatch runs (auto)
③ Auto-reveal the FULL match to patient  +  anti-disintermediation anchor  (Oia, auto)
④ "Negotiate this" task → CEO negotiates price manually with the clinic (Phase 1)
⑤ CEO enters secured price/package on the dashboard
⑥ Oia relays the secured price + UK-savings comparison (auto)
⑦ Patient decides → team assembles the trip → Oia presents (team + Oia)
⑧ Warm handoff to clinic coordinator; Oia NEVER takes payment
⑨ Recovery: daily check-ins, symptom LOGGING (never assessing), escalate anything concerning
```

**The match is instant; the price is not** — because Phase-1 negotiation is manual (CEO). See open decisions §10 for the patient-wait framing.

---

## 7. Photo Similarity — Option A (Decision)

**Tag-based, not biometric.** The photo is used by Oia to *derive structured tags* (`jowl_severity: moderate`, etc.), a human confirms them, and then similarity = **tag overlap** between the patient and each provider's tagged before/after cases. **No face embeddings, no stored biometrics, no image-to-image matching.**

Guardrails (Decision):
- Before/after images only appear after the **explicit "I understand — view images" consent gate**.
- Framing is always **realistic range, never "your result"** — no outcome simulation, ever.
- Provider before/after photos require **rights to show** (`rightsToShow`).
- Rejected for the pilot: **Option B** (visual embeddings — GDPR special-category biometric processing, DPIA, black-box) and **Option C** (outcome simulation — forbidden by SOUL).

---

## 8. Anti-Disintermediation — the moat (Decision)

**Full reveal of doctor + clinic**, and the moat is a **price you can't get by walking in the front door**, not information secrecy.

- **Phase 1:** the discount is **negotiated per patient, manually by the CEO** (industry relationships). Oia's role = **promise + relay**, not haggle. At reveal she must **anchor value forward**: *"please don't message them directly — you'd pay list price; going through me is how you get the partner rate and I handle your whole trip."* This one line holds the moat during the negotiation gap.
- **Phase 2:** **standing locked rates per clinic** → Oia states the discount instantly and negotiates autonomously (the `submit_clinic_quote` engine we already built).
- **Provider contact (WhatsApp) is INTERNAL** — the negotiation tool, never handed to the patient. Connection is always brokered ("I'm connecting you").
- **Honesty/CAP-ASA:** any "special discount / you save £X" must be **real, exclusive, and substantiated** — a genuine reference price (real UK/list price) and a rate the clinic won't give a cold direct patient. If a patient could get the same or better going direct, the moat *and* the trust both collapse. This is a **partnership term negotiated at clinic onboarding**, not something code can invent.

---

## 9. Human-in-the-loop

- **Match selection:** none — auto-sent (Decision).
- **Provider verification:** human sets the `verified` safety flag before a provider is matchable (§4).
- **Negotiation:** the human step in Phase 1 (CEO); becomes autonomous in Phase 2.

---

## 10. Edge Cases & Open Decisions — **[PROPOSAL / needs sign-off]**

From the full-flow walkthrough, these are undefined and need your call:

1. **The negotiation wait (③→⑥).** What does Oia promise — "within the hour," "today," "24h"? And what holds the patient beyond the anchor line?
2. **Indicative price at reveal.** Does Oia show a "fraction of UK" range *before* you negotiate (more convincing, must be a real country-average) or stay vague until ⑥?
3. **No eligible match / out-of-scope** (common in a limited pilot): patient in a country we don't serve, or wants a treatment no verified provider offers. Proposed: **note interest, be honest about the deliberate limited launch, never turn away** (per SOUL).
4. **Budget too low even cross-border.** Proposed: honest range + offer to note interest / suggest non-surgical where appropriate (never pushy).
5. **Minor (<18).** Hard stop — pause intake, no matching/photos/pricing (SOUL hard line).
6. **Payment & booking rails.** Currently undefined — clinic takes payment directly? deposit? This is the actual conversion moment and needs definition.
7. **How many providers to present** (1 best, or a top 2–3?).

---

## 11. SOUL.md reconciliation (changes these decisions force)

To keep Oia honest, finalizing SOUL.md must:
- **Remove** "the team reviews every profile / you'll hear back in 24–48h / the team reviews everything" — auto-send makes these false.
- **Allow naming** the clinic/surgeon at match (was "don't name clinics during intake").
- **Add** the anti-disintermediation anchor line (§8).
- **Keep** "never quote numbers that aren't live" and the medical/minor/never-fabricate hard lines unchanged.

---

## 12. Non-Functional Requirements

- **Explainability:** every match is a transparent factor breakdown (auditable).
- **Config-driven:** scoring weights + coverage facts are config the CEO controls (training-lab vision).
- **Privacy/GDPR:** patient photos are special-category data → private store (already built), consent-gated, minimal processing (Option A avoids biometrics).
- **Data freshness:** provider price/availability go stale → confirmed at negotiation, not cached as truth.
- **Performance:** tiny pool → trivial; no scaling concerns at pilot.

---

## 13. Build Sequence (dependency-ordered)

| # | Item | Who |
|---|---|---|
| 1 | **Master tag vocabulary** (shared enums) | Eng drafts → CEO refines |
| 2 | **Treatments cluster** (two-tier, tagged) | Eng drafts taxonomy → CEO prunes |
| 3 | **Providers cluster** (DB tables + admin section, empty) | Eng |
| 4 | **Populate providers** — CEO supplies UK+TR clinic URLs → Eng extract+tag → CEO verifies | CEO + Eng |
| 5 | **SmartMatch engine** (Interpret + Filter + Score) | Eng |
| 6 | **Wire into Oia** (auto-send match + price relay) | Eng |

**CEO prep needed before build:** the **clinic URL list** (UK + Turkey), pasted one-per-line, grouped by country. Engineering handles extraction/tagging/placement.

---

## 14. Phase 2 (future — out of scope for pilot)

Standing locked clinic rates · Oia autonomous negotiation · curation AI for the clusters · additional countries · live flight/logistics calculation · structured availability.

---

*End of TRD v0.1. Sign-off needed on §10 (open decisions) and the §5.4 weights before build item #5.*
