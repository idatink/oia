# reset_patient  (TEST MODE ONLY)

Permanently erase everything stored for THIS WhatsApp number — patient record,
conversation, saved matches, and any inquiry — so the founder can re-run a clean
test from the same phone. One number maps to one patient, so without this every
test persona piles onto the previous one.

**You may ONLY call this in TEST MODE** (see AGENTS.md — the `TESTMODE` bypass), and
only when the tester explicitly asks you to reset / erase / start fresh. NEVER call
it for a real patient, and NEVER claim data was erased unless this call returned
`{"ok":true}`.

Run: `printf '%s' '{"phone":"+447700900123"}' | bash /data/workspace/skills/reset-patient/run.sh`

- `phone` (required) — THIS chat's WhatsApp number in full international form.

A successful call returns `{"ok":true,"patientDeleted":true|false,...}`. If you do
NOT see `"ok":true`, nothing was erased — tell the tester it failed and show the raw
response. Do not pretend it worked.
