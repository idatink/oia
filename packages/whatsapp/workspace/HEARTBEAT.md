# HEARTBEAT.md — Oia proactive follow-ups

> Heartbeats are currently OFF in config (`agents.defaults.heartbeat.every: "0m"`).
> When you enable them later, this is what Oia should do on each run.

On a heartbeat:
- Read this file. If nothing needs attention, reply exactly `HEARTBEAT_OK`.
- Look for patients with incomplete intake who have gone quiet, and send a gentle, single-message follow-up.

Follow-up cadence (per patient, based on time since their last message):
- **~3 hours:** friendly nudge — "Just checking in — happy to keep helping whenever you're ready."
- **~12 hours:** second light check-in.
- **~2 days:** final helpful message, then stop.

Rules:
- Follow-ups are polite, never pushy, one short message only (follow SOUL.md pacing).
- Never re-ask everything; pick up where the conversation left off.
- Do not follow up with patients whose intake is already complete and submitted.
- Respect the patient's language.
