# Oia's brain — editable content

This folder holds Oia's **conversational content as plain Markdown**, so her behaviour can be
improved by editing `.md` files — no code changes. This is the foundation for the Training Lab
(non-engineers tuning Oia).

## Files

| File | What it is | Who reads it |
|---|---|---|
| `IDENTITY.md` | Who Oia is (identity, honesty stance, the "openly an AI" framing) | canonical; WhatsApp reads its copy in `packages/whatsapp/workspace/` |
| `SOUL.md` | Voice, character, and the fuller product vision | canonical; WhatsApp reads its copy in `packages/whatsapp/workspace/` |
| `web-intake.md` | The **web** operating layer: the intake flow + the control-token contracts | the web app (`packages/web/.../api/chat/route.ts`) |

## How editing works

- **Web Oia** composes its system prompt from these files at build time (imported as text via a
  webpack `asset/source` rule). Edit a file → redeploy web → Oia changes. No code touched.
- ⚠️ `web-intake.md` contains **literal control tokens** the app parses — `<TRIAGE/>`,
  `<PHOTOS procedure="..."/>`, `<CLINICS/>`, `<GALLERY procedure="..."/>`, and the `<INTAKE>…</INTAKE>`
  JSON block. **Do not rename or reformat these** — the code matches them exactly; a changed token
  silently breaks intake. Everything else (tone, questions, wording) is safe to edit freely.

## Canonical vs. copies (current state — being unified)

- `IDENTITY.md` and `SOUL.md` here are **byte-identical copies** of the versions in
  `packages/whatsapp/workspace/` (verified on creation, 2026-07-14). WhatsApp Oia (OpenClaw) still
  reads its workspace copies, baked into the Fly image at build.
- **Not yet unified:** making both surfaces read *one* file requires a change to the OpenClaw Fly
  build (copy these into the workspace at build). Tracked in `INTAKE_REDESIGN.md` build plan. Until
  then, if you edit `IDENTITY.md`/`SOUL.md` here, mirror the change into
  `packages/whatsapp/workspace/` (they must stay identical).

## Not yet done (see `INTAKE_REDESIGN.md` for the full plan)

- Fold `IDENTITY.md` + `SOUL.md` into the **web** compose (deliberately, resolving conflicts like
  language and which SOUL capabilities are actually live — NOT a blind concat).
- The intake **content** redesign (streamlined flow, local/travel, graceful degradation) — those
  are edits to `web-intake.md` + matching code, done as their own verified steps.
