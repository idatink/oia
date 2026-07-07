---
name: smart-match
description: >
  Find the best-matched surgeons for a patient. Give it the procedure (or the
  patient's concern) plus their country, age, and goals; it returns a ranked
  shortlist of vetted providers with the reasons each was chosen. Use this after
  intake, once you know what the patient wants.
requiredEnv:
  - NIA_API_URL
  - NIA_WHATSAPP_SECRET
---

# smart-match

Run it by piping a JSON payload into `run.sh`:

```
printf '%s' '<JSON>' | bash /data/workspace/skills/smart-match/run.sh
```

## Input (JSON)
- `procedure` — the treatment in plain words, e.g. "facelift", "nose job", "tummy tuck". (Or `treatmentSlug` if you already resolved it.)
- `concernTags` — optional array of what she wants addressed, e.g. `["jowls","midface_descent"]`. Improves the match.
- `country` — the patient's ISO country, e.g. "GB" for the UK, "TR" for Turkey.
- `ageBand` — optional, e.g. "45-54".
- `goalTags` — optional, e.g. `["natural","refreshed"]`.
- `limit` — optional, default 3.

## Output (JSON)
```
{
  "treatment": { "name": "Facelift", "cluster": "Face" },
  "providers": [
    { "surgeonName": "...", "clinicName": "...", "city": "...",
      "accreditations": ["FEBOPRAS","ISAPS"], "reviewRating": 4.9, "reviewCount": 160,
      "score": 99, "reasons": ["Board / international accreditation ...", "4.9★ from 160 reviews"] }
  ],
  "note": "..."   // present only when there is a problem
}
```

## How to use the result
- If `providers` is non-empty: present them as the shortlist (see AGENTS.md for the card format). Reveal the surgeon and clinic, lead with the reasons, and remind her the partner rate comes only through Oia — she should not contact the clinic directly.
- If `note` is `no_matchable_treatment` or `not_in_pilot_scope`: we don't cover that yet. Be honest, note her interest, and say the team is expanding — never invent a match.
- If `note` is `no_providers_in_scope`: tell her the team is curating options for her profile and will follow up.
- Never show the `score` number to the patient. The reasons are for you to phrase warmly.
