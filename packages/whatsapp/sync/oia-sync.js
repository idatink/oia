#!/usr/bin/env node
/*
 * Oia real-time conversation syncer (sidecar).
 *
 * OpenClaw has no message webhook, so this tails the gateway's live session
 * files and streams every new inbound/outbound turn to the dashboard's
 * /api/intake/message endpoint. That makes EVERY WhatsApp conversation visible
 * on the dashboard as it happens — including the ones that drop off before
 * completing intake — so the team can see where people fall away.
 *
 * Design notes:
 *  - Runs as a background process next to `openclaw gateway` (see entrypoint.sh).
 *  - Reads NIA_API_URL / NIA_WHATSAPP_SECRET from /data/openclaw.json so it uses
 *    the exact same endpoint + secret the skills already use (kept in one place).
 *  - Idempotent: each message carries OpenClaw's stable message id; the endpoint
 *    de-dupes, and we also track a per-file line offset so we only read the tail.
 *  - Baselines existing history on first run (initialises offsets to current
 *    line counts) so pre-existing test threads aren't retroactively re-posted.
 *  - Never throws out of the loop; a bad poll is logged and retried.
 */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const STATE = process.env.OPENCLAW_STATE_DIR || '/data';
const CONFIG_PATH = path.join(STATE, 'openclaw.json');
const SESSIONS_DIR = path.join(STATE, 'agents', 'main', 'sessions');
const OFFSETS_PATH = path.join(STATE, '.oia-sync-offsets.json');
const POLL_MS = 3000;
const PHONE_KEY_RE = /whatsapp:direct:(\+\d+)/;

function loadConfigEnv() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return cfg.env || {};
  } catch {
    return {};
  }
}

function readOffsets() {
  try {
    return JSON.parse(fs.readFileSync(OFFSETS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeOffsets(offsets) {
  try {
    const tmp = OFFSETS_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(offsets));
    fs.renameSync(tmp, OFFSETS_PATH);
  } catch (e) {
    console.error('[oia-sync] failed to persist offsets:', e.message);
  }
}

// Map each whatsapp:direct session key -> { phone, file } from sessions.json.
function currentSessions() {
  const out = [];
  let map;
  try {
    map = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, 'sessions.json'), 'utf8'));
  } catch {
    return out;
  }
  const entries = map && map.sessions ? map.sessions : map;
  for (const [key, value] of Object.entries(entries || {})) {
    const m = key.match(PHONE_KEY_RE);
    if (!m) continue;
    const id = value && (value.id || value.sessionId);
    if (!id) continue;
    out.push({ phone: m[1], file: `${id}.jsonl` });
  }
  return out;
}

function extractText(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter(b => b && b.type === 'text' && typeof b.text === 'string')
      .map(b => b.text)
      .join('\n')
      .trim();
  }
  return '';
}

function readLines(file) {
  try {
    const raw = fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf8');
    return raw.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

async function postMessage(api, secret, payload) {
  try {
    const res = await fetch(`${api}/api/intake/message`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[oia-sync] POST ${res.status} for ${payload.phone} msg ${payload.messageId}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[oia-sync] POST failed:', e.message);
    return false;
  }
}

// ── Outbound sender ──────────────────────────────────────────────────────────
// Poll the dashboard for queued "invite back to web" messages and send each via
// Oia's WhatsApp (the running gateway in this container). Safe: these go only to
// people who messaged us first (warm reply), never cold outreach.
// WhatsApp needs E.164. Waitlist numbers arrive in mixed shapes ("07599444386",
// "+44 7700 900555", "447…") — normalise (UK-aware) before sending.
function toE164(raw) {
  let s = String(raw || '').replace(/[^\d+]/g, '');
  if (!s) return s;
  if (s.startsWith('+')) return s;
  if (s.startsWith('00')) return '+' + s.slice(2);
  if (s.startsWith('44')) return '+' + s;
  if (s.startsWith('0')) return '+44' + s.slice(1); // UK national
  return '+' + s;
}

function sendWhatsApp(phone, message) {
  phone = toE164(phone);
  return new Promise(resolve => {
    execFile(
      'openclaw',
      ['message', 'send', '--channel', 'whatsapp', '--account', 'work', '--target', phone, '--message', message],
      { env: process.env, timeout: 60000 },
      (err, stdout, stderr) => {
        if (err) {
          console.error(`[oia-outbound] send to ${phone} failed:`, (stderr || err.message || '').slice(0, 300));
          resolve(false);
        } else {
          resolve(true);
        }
      },
    );
  });
}

async function outboundTick() {
  const env = loadConfigEnv();
  const api = process.env.NIA_API_URL || env.NIA_API_URL;
  const secret = process.env.NIA_WHATSAPP_SECRET || env.NIA_WHATSAPP_SECRET;
  if (!api || !secret) return;

  let pending = [];
  try {
    const res = await fetch(`${api}/api/outbound/pending`, { headers: { authorization: `Bearer ${secret}` } });
    if (!res.ok) return;
    pending = (await res.json()).pending || [];
  } catch (e) {
    console.error('[oia-outbound] pending fetch failed:', e.message);
    return;
  }

  for (const item of pending) {
    if (!item || !item.phone || !item.message) continue;
    const ok = await sendWhatsApp(item.phone, item.message);
    try {
      await fetch(`${api}/api/outbound/sent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
        body: JSON.stringify({ messageId: item.messageId, ok }),
      });
    } catch (e) {
      console.error('[oia-outbound] sent-report failed:', e.message);
    }
    if (ok) console.log(`[oia-outbound] invited ${item.phone}`);
  }
}

// TESTMODE reset: when a patient texts "TESTMODE", wipe everything registered for
// that number (DB) AND clear Oia's conversation memory for the peer, so the same
// number can run clean back-to-back tests. Deterministic — not model-dependent.
async function testModeReset(api, secret, phone, file) {
  try {
    await fetch(`${api}/api/intake/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify({ phone }),
    });
  } catch (e) {
    console.error('[oia-testmode] db reset failed:', e.message);
  }
  // Clear the peer's OpenClaw conversation memory (delete the transcript + drop
  // the sessions.json key so the next message starts a brand-new session).
  try { fs.unlinkSync(path.join(SESSIONS_DIR, file)); } catch {}
  try {
    const sp = path.join(SESSIONS_DIR, 'sessions.json');
    const map = JSON.parse(fs.readFileSync(sp, 'utf8'));
    const entries = map.sessions || map;
    for (const key of Object.keys(entries)) {
      const m = key.match(PHONE_KEY_RE);
      if (m && m[1] === phone) delete entries[key];
    }
    const tmp = sp + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(map));
    fs.renameSync(tmp, sp);
  } catch (e) {
    console.error('[oia-testmode] session clear failed:', e.message);
  }
  delete offsets[file];
  console.log(`[oia-testmode] wiped ${phone} (db + conversation memory)`);
}

let offsets = readOffsets();

async function tick() {
  const env = loadConfigEnv();
  const api = process.env.NIA_API_URL || env.NIA_API_URL;
  const secret = process.env.NIA_WHATSAPP_SECRET || env.NIA_WHATSAPP_SECRET;
  if (!api || !secret) return; // config not seeded yet

  const sessions = currentSessions();

  // First ever run: baseline offsets to existing line counts so we don't
  // retroactively re-post threads that predate the syncer.
  if (offsets === null) {
    offsets = {};
    for (const s of sessions) {
      const lines = readLines(s.file);
      offsets[s.file] = lines ? lines.length : 0;
    }
    writeOffsets(offsets);
    console.log(`[oia-sync] baselined ${sessions.length} existing session(s).`);
    return;
  }

  let changed = false;
  for (const { phone, file } of sessions) {
    const lines = readLines(file);
    if (!lines) continue;

    let from = offsets[file] || 0;
    // File was truncated/rewritten (e.g. compaction) — reprocess from top; the
    // endpoint de-dupes by messageId so this is safe.
    if (lines.length < from) from = 0;

    // DELIVERY GUARANTEE: the offset cursor only advances past a turn once its POST
    // succeeded. On a failed POST we stop and retry the same line next tick —
    // previously the offset jumped to EOF regardless, so any turn that failed to
    // deliver (e.g. mid dashboard redeploy) was silently lost forever, which also
    // starved the reconciler safety nets (root of the Paloma waitlist drop, 2026-07-15).
    let cursor = from;
    let wiped = false;
    let posted = 0;
    for (let i = from; i < lines.length; i++) {
      let evt;
      try {
        evt = JSON.parse(lines[i]);
      } catch {
        cursor = i + 1;
        continue;
      }
      if (!evt || evt.type !== 'message' || !evt.message) { cursor = i + 1; continue; }
      const role = evt.message.role === 'user' ? 'patient' : 'oia';
      const content = extractText(evt.message.content);
      if (!content) { cursor = i + 1; continue; } // pure thinking / tool / media with no text
      // TESTMODE from the patient wipes the number (db + memory) — do it and stop
      // processing this session (its file is now gone).
      if (role === 'patient' && /\btestmode\b/i.test(content)) {
        await testModeReset(api, secret, phone, file);
        changed = true;
        wiped = true;
        break;
      }
      const ok = await postMessage(api, secret, {
        phone,
        role,
        content,
        messageId: evt.id,
        ts: evt.timestamp,
      });
      if (!ok) break; // do NOT advance — retry this turn next tick
      posted++;
      cursor = i + 1;
    }
    if (wiped) continue; // session file deleted — skip the offset update

    if (posted > 0) console.log(`[oia-sync] delivered ${posted} turn(s) for ${phone}`);
    if (cursor !== (offsets[file] || 0)) {
      offsets[file] = cursor;
      changed = true;
    }
  }
  if (changed) writeOffsets(offsets);
}

async function loop() {
  let ticks = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await tick();
    } catch (e) {
      console.error('[oia-sync] tick error:', e.message);
    }
    try {
      await outboundTick();
    } catch (e) {
      console.error('[oia-outbound] tick error:', e.message);
    }
    // Heartbeat every ~5 min so a dead/silent syncer is visible in `fly logs`
    // (its total silence is what made the 2026-07-15 delivery gap hard to spot).
    ticks++;
    if (ticks % 100 === 0) {
      console.log(`[oia-sync] heartbeat — alive, tracking ${currentSessions().length} session(s)`);
    }
    await new Promise(r => setTimeout(r, POLL_MS));
  }
}

console.log('[oia-sync] real-time conversation syncer started.');
loop();
