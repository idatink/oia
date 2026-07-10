#!/usr/bin/env node
/**
 * Oia tools — MCP stdio server.
 *
 * Exposes Oia's backend skills as NATIVE, function-callable MCP tools so the
 * agent (Qwen) can invoke them the way it naturally wants to — instead of being
 * told to shell out via `exec bash …/run.sh`, which weaker/non-Anthropic models
 * fire only intermittently (→ silent lead loss). Each tool forwards its
 * structured arguments straight to the existing dashboard HTTP endpoint.
 *
 * Dependency-free: implements MCP (JSON-RPC 2.0 over newline-delimited stdio)
 * directly, and uses global fetch (Node 18+). Reads NIA_API_URL +
 * NIA_WHATSAPP_SECRET from the environment (supplied by the OpenClaw mcp config).
 */
'use strict';

const API = (process.env.NIA_API_URL || '').replace(/\/+$/, '');
const SECRET = process.env.NIA_WHATSAPP_SECRET || '';
const PROTOCOL_VERSION = '2024-11-05';

// ── Tool catalogue ───────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'create_nia_inquiry',
    description:
      "Register a patient's completed intake so it becomes a Lead the team can act on. Call this ONCE, at the end of intake, after collecting the full checklist and doing your internal suitability assessment. Returns {ok:true,leadId,patientId} on success.",
    path: '/api/intake/whatsapp',
    extra: { surface: 'whatsapp' },
    inputSchema: {
      type: 'object',
      required: ['phone', 'name', 'procedure'],
      properties: {
        phone: { type: 'string', description: "Patient's WhatsApp number, full international form e.g. +447700900123" },
        name: { type: 'string', description: "Patient's name" },
        procedure: { type: 'string', description: 'Treatment they want, plain words (e.g. "tummy tuck")' },
        dateOfBirth: { type: 'string', description: 'ISO date or plain date, e.g. "1991-03-12"' },
        countryOfResidence: { type: 'string', description: 'Country they live in' },
        preferredLanguage: { type: 'string' },
        intent: { type: 'string', description: 'One-sentence summary of their goal' },
        medicalScreening: {
          type: 'object',
          description: 'Map of each screened condition to true/false, e.g. {"diabetes":false,"bloodClots":false,...}',
          additionalProperties: { type: 'boolean' },
        },
        photoUrls: { type: 'array', items: { type: 'string' }, description: 'Uploaded photo URLs (from upload_patient_photo)' },
        photosDeclined: { type: 'boolean', description: 'true if the patient declined photos after two asks' },
        conversationTranscript: { type: 'string', description: 'Full transcript, alternating "Patient:" / "Oia:" lines' },
        aiScore: { type: 'number', description: 'Booking-intent score 0–100 (internal)' },
        aiPriority: { type: 'string', description: '"High" | "Medium" | "Low" (internal)' },
        aiRationale: { type: 'string', description: '2–3 sentence rationale for the team (internal)' },
      },
    },
  },
  {
    name: 'smart_match',
    description:
      "After create_nia_inquiry succeeds, get the patient's ranked shortlist of real, vetted surgeons. Pass the phone so the match is saved for the team. Returns {treatment, providers:[{surgeonName,clinicName,city,accreditations,reviewRating,score,reasons}], note?}.",
    path: '/api/smartmatch',
    inputSchema: {
      type: 'object',
      required: ['phone', 'procedure'],
      properties: {
        procedure: { type: 'string', description: 'Treatment in plain words' },
        phone: { type: 'string', description: "Patient's WhatsApp number (E.164) — saves the match for the team" },
        country: { type: 'string', description: 'Patient country as ISO alpha-2, e.g. "GB", "TR"' },
        ageBand: { type: 'string', description: 'Optional, e.g. "35-44"' },
        concernTags: { type: 'array', items: { type: 'string' }, description: 'Optional concern tags to sharpen the match' },
      },
    },
  },
  {
    name: 'join_waitlist',
    description:
      "While at capacity, record a WhatsApp waitlist signup so it shows in Admin → Waitlist. Call once you have their name, email, and intention. Returns {ok:true} on success.",
    path: '/api/intake/waitlist',
    inputSchema: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: { type: 'string', description: "This chat's WhatsApp number, full international form" },
        name: { type: 'string' },
        email: { type: 'string' },
        procedure: { type: 'string', description: 'Their intention / procedure of interest' },
        notes: { type: 'string' },
      },
    },
  },
  {
    name: 'reset_patient',
    description:
      'TEST MODE ONLY. Permanently erase everything stored for a WhatsApp number so a clean test can rerun from the same phone. Only call when a tester explicitly asks to reset/erase. Returns {ok:true} on success.',
    path: '/api/intake/reset',
    inputSchema: {
      type: 'object',
      required: ['phone'],
      properties: { phone: { type: 'string', description: "The chat's WhatsApp number to wipe" } },
    },
  },
];

const TOOL_BY_NAME = Object.fromEntries(TOOLS.map(t => [t.name, t]));

async function callTool(name, args) {
  const tool = TOOL_BY_NAME[name];
  if (!tool) throw new Error(`unknown tool: ${name}`);
  if (!API) throw new Error('NIA_API_URL is not configured');
  const body = JSON.stringify({ ...(tool.extra || {}), ...(args || {}) });
  const res = await fetch(`${API}${tool.path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${tool.path} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  return text;
}

// ── MCP JSON-RPC plumbing ────────────────────────────────────────────────────
function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}
function ok(id, result) {
  send({ jsonrpc: '2.0', id, result });
}
function err(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handle(msg) {
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: (params && params.protocolVersion) || PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'nia-tools', version: '1.0.0' },
      });
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return; // notifications: no reply
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
    case 'tools/call': {
      const name = params && params.name;
      const args = (params && params.arguments) || {};
      try {
        const out = await callTool(name, args);
        return ok(id, { content: [{ type: 'text', text: out }] });
      } catch (e) {
        // Tool-level error: report as isError content so the model can react.
        return ok(id, { content: [{ type: 'text', text: `ERROR: ${e.message}` }], isError: true });
      }
    }
    default:
      if (!isNotification) err(id, -32601, `method not found: ${method}`);
  }
}

// Line-buffered stdin reader (messages are newline-delimited JSON).
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue; // ignore malformed lines
    }
    Promise.resolve(handle(msg)).catch(e => {
      if (msg && msg.id != null) err(msg.id, -32603, String(e && e.message ? e.message : e));
    });
  }
});
process.stdin.on('end', () => process.exit(0));
