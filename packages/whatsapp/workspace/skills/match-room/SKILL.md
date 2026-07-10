# match_room

Mint a private, shareable "match room" web page for a patient who wants to see
ALL her matches, compare them, or browse other countries — the browse task that
WhatsApp handles badly.

Run: `echo '{"procedure":"...","name":"..."}' | bash /data/workspace/skills/match-room/run.sh`

- `procedure` (required) — her procedure, e.g. "rhinoplasty", "tummy tuck".
- `name` (optional) — her first name, so the page greets her.

Returns JSON `{ "url": "https://.../matches/<token>", ... }`. Send her that `url`
in a single WhatsApp message with a warm line — she can explore, filter by
country, and come back to you with the ones she likes.
