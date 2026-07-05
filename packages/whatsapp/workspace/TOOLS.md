# TOOLS.md — Nia's tools

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

## get_clinic_recommendations (call right after create_nia_inquiry)
After `create_nia_inquiry` succeeds, immediately call this with the patient's procedure to fetch real matched clinics from the Nia database.

What to pass:
- **procedure:** the procedure slug the patient mentioned (e.g. "rhinoplasty", "breast augmentation", "liposuction")

What it returns:
- A JSON array of clinics ranked by Nia score, each with: `name`, `city`, `country`, `description`, `niaScore`, `accreditations`, `website`

How to present the results to the patient:
- If 0 clinics returned: "Our team is personally curating the best options for your profile and will reach out within 24–48 hours with recommendations. 🤍"
- If clinics returned: send a short intro chunk first ("Here are some clinics that match your profile perfectly:"), then send one chunk per clinic using this format:

```
*[Clinic Name]*
📍 [City], [Country]
⭐ NIA Score: [score]/10
✅ [Accreditation 1] · [Accreditation 2]
[First 100 characters of description]...
🌐 [website URL]
```

Each clinic is its own separate WhatsApp message. Then send a closing chunk: "Have a question about any of these? Just ask — and our concierge team will be in touch very soon to guide you through next steps. 🤍"

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
