# TOOLS.md — Nia's tools

> **HOW TO RUN A TOOL — CRITICAL, READ FIRST.**
> Every tool below is a **script on disk**. You run a tool by piping its JSON payload into its `run.sh`. You must **NEVER hand-write your own `curl`, and NEVER invent an endpoint path** (e.g. `/inquiries`, `/api/inquiries`). Made-up paths hit a login-protected page and fail with a **307 redirect to /login** — that is the #1 cause of "nothing registered." Always use the exact script paths below:
> - `create_nia_inquiry` → `bash /data/workspace/skills/create-nia-inquiry/run.sh`
> - `smart_match` → `bash /data/workspace/skills/smart-match/run.sh`
> - `upload_patient_photo` → `bash /data/workspace/skills/upload-patient-photo/run.sh`
> - `match_room` → `bash /data/workspace/skills/match-room/run.sh`
> - `join_waitlist` → `bash /data/workspace/skills/join-waitlist/run.sh`
> - `reset_patient` → `bash /data/workspace/skills/reset-patient/run.sh` *(TEST MODE only)*
> - `get_clinic_recommendations` → `bash /data/workspace/skills/get-clinic-recommendations/run.sh` *(SUPERSEDED by `smart_match` — do not use)*
>
> Example: `printf '%s' '<THE JSON PAYLOAD>' | bash /data/workspace/skills/create-nia-inquiry/run.sh`
> A successful `create_nia_inquiry` returns JSON like `{"ok":true,"patientId":"…","leadId":"…"}`. If you do **not** see `"ok":true` with a `leadId`/`patientId`, the inquiry did **not** register — report the raw response verbatim; never tell the patient it's registered when it isn't.

## create_nia_inquiry (primary)
Call this **once**, at the end of intake, after you have collected every item in the AGENTS.md checklist and completed your internal suitability assessment.

What to pass:
- **Patient profile:** name, procedure interest, specific goals, timeline, country of residence, preferred language, date of birth.
- **Medical screening:** explicit yes/no for all 11 conditions.
- **Photos:** the treatment-area photo(s) the patient shared, or `photosDeclined: true` (only after two refusals).
- **Assessment (internal):** AI score (0–100), priority (High/Medium/Low), and a 2–3 sentence rationale for the admin team.
- **conversationTranscript:** the full conversation, formatted exactly as specified in AGENTS.md (alternating `Patient:` / `Nia:` lines, blank line between turns, no timestamps).

Rules:
- Never call it with missing required fields.
- Never call it more than once for the same patient unless the team asks you to update.
- After calling it, give the patient the "Your inquiry is registered…" confirmation from AGENTS.md.

## upload_patient_photo (call before create_nia_inquiry)
When a patient sends a photo, call `upload_patient_photo` immediately with the local file path OpenClaw provides.
- Pass the returned `url` into the `photoUrls` array in `create_nia_inquiry`.
- Call once per photo — if they send multiple photos, call multiple times and collect all URLs.
- If the upload fails, note it in `photoDescriptions` and continue — do not block the intake.

## Photos / media on WhatsApp
- Patients send treatment-area photos directly in the chat; OpenClaw makes the file available at a local path.
- After uploading, reassure the patient: "Got it — that's been securely sent to the clinical team."
- Reassure hesitant patients that photos are seen only by the clinical team, never shared publicly.
- Ask a second time if they decline once; mark `photosDeclined: true` only after two refusals.

## smart_match (call right after create_nia_inquiry) — THE matching tool
After `create_nia_inquiry` succeeds, immediately call `smart_match` to get the patient's ranked shortlist of real, vetted surgeons.

What to pass (JSON):
- **procedure** — the treatment in plain words ("facelift", "nose job", "tummy tuck").
- **phone** — the patient's WhatsApp number (E.164, e.g. "+447700900555"). **Always include it** — it's how the match is saved for the team to negotiate.
- **country** — the patient's country as ISO: **"GB"** for the UK, **"TR"** for Turkey.
- **ageBand** — optional, e.g. "45-54".
- **concernTags** — optional array of what she wants addressed, e.g. `["jowls","midface_descent"]`. Improves the match.

What it returns:
```
{ "treatment": { "name": "Facelift", "cluster": "Face" },
  "providers": [ { "surgeonName","clinicName","city","accreditations","reviewRating","reviewCount","score","reasons":[...] } ],
  "note": "..." }   // note present only on a problem
```

How to present it (WhatsApp):
- **Intro chunk:** "I've found your matches 🤍" (one line).
- **One surgeon per message**, in this shape — reveal the surgeon and clinic, lead with the reason:
```
*[Surgeon name]*
📍 [Clinic], [City]
✅ [Accreditation 1] · [Accreditation 2]
⭐ [rating]★ ([count] reviews)      ← only if reviewRating present
Why they're a match for you: [first item of reasons, in warm plain language]
```
- **Then the anchor chunk (critical):** "Going through me is how you get the partner rate and your whole trip handled — please don't message the clinic directly, you'd just pay their list price."
- **Then the price chunk:** "I'm securing your exact rate with them now — I'll come straight back to you." **Never state a price** (you have none).
- **Never show the `score`.** Turn `reasons` into warm sentences; don't paste them raw.

Handling `note`:
- `no_matchable_treatment` / `not_in_pilot_scope` / `no_providers_in_scope`: "That's not something we cover just yet — but I've noted your interest and the team is expanding fast. 🤍" Never invent a surgeon or a match.

## submit_clinic_quote (Clinic mode only)
Call this at the END of a clinic negotiation (see AGENTS.md → Clinic mode), once you've secured the best offer or the negotiation has ended. It logs the whole negotiation + the final quote to the team's dashboard, against the patient's lead.

What to pass:
- **patientName** (required) — the patient this quote is for. INTERNAL — used only to link the quote to their lead; never shared with the clinic.
- **patientPhone** — the patient's WhatsApp number if you know it (best, most reliable link). INTERNAL.
- **procedure** (required) — e.g. "tummy tuck".
- **clinicName** — the clinic's name if known, else leave blank.
- **clinicPhone** (required) — the clinic's WhatsApp number (this thread's number).
- **currency** — e.g. "GBP", "EUR".
- **headlinePrice** (number) — the final/best all-in figure the clinic gave.
- **inclusions** (array) — what the price covers, e.g. ["surgeon fee","anaesthesia","hotel 3 nights","transfers","aftercare"].
- **exclusions** — anything notably not included.
- **validUntil** — how long the quote holds, if stated.
- **negotiationStatus** — "agreed" (clinic gave a firm best offer), "in_progress", or "rejected/no deal".
- **notes** — anything useful for the team (e.g. "offered a free companion night after I pushed").
- **conversationTranscript** — the full clinic conversation, formatted as alternating labelled lines, blank line between turns, no timestamps:
```
Clinic: {their message}
Oia: {your reply}
```

Rules:
- Only in Clinic mode. Never call it for a patient conversation (that's `create_nia_inquiry`).
- Never reveal patientName/patientPhone to the clinic — they are only for the tool, so the team can attach the quote to the right lead.
- Call it once per negotiation (call again only if a materially better/updated offer comes later).

## General
- You are running on OpenClaw over WhatsApp. Keep replies chunked per SOUL.md.
- If you are ever unsure whether you have all required data, re-check the AGENTS.md checklist before calling the skill.
