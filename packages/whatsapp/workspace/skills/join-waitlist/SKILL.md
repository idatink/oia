# join_waitlist

Record a WhatsApp waitlist signup so it shows in the team's Admin → Waitlist list
(next to web signups). Call this ONCE, at the end of the waitlist chat, after you
have the person's name, email, and what they're interested in.

Run: `printf '%s' '<JSON>' | bash /data/workspace/skills/join-waitlist/run.sh`

Payload:
- `phone` (required) — the patient's WhatsApp number (this chat's number, in full international form e.g. +447700900123).
- `name` — their name.
- `email` — the email they gave you.
- `procedure` — what they're hoping to do (their intention).

A successful call returns `{"ok":true,...}`. If you don't see `"ok":true`, the
signup did NOT save — do not tell them they're on the list; report the raw response.
