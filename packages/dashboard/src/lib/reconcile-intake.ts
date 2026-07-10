import Anthropic from '@anthropic-ai/sdk';
import { db } from '@nia/shared/src/db';

// ── Intake reconciler (safety net) ───────────────────────────────────────────
// Oia's conversational model (Qwen, per the lock) sometimes finishes an intake
// but never fires create_nia_inquiry (it defers, or mis-names the tool) → the
// patient would be silently lost. Since every WhatsApp turn is already synced to
// the dashboard, we can rescue it server-side: when a synced conversation LOOKS
// complete but has no Lead, a cheap one-shot extraction (Haiku — a backend step,
// NOT Oia's model) pulls the structured fields from the transcript, then we reuse
// the existing /api/intake/whatsapp + /api/smartmatch endpoints to create the
// Lead + shortlist. Result: lead-loss is impossible regardless of model flakiness.

// Phrases Oia says once she believes intake is done — cheap trigger before the
// (more expensive) no-lead check + extraction.
const COMPLETION_SIGNALS = [
  'register your inquiry',
  'run smartmatch',
  'run your profile through',
  "you're matched",
  'your matches',
  'your shortlist',
  'finding your best matches',
  'securing your exact rate',
  'intake as complete',
  'intake is complete',
  "i've got all your details",
];

export function looksComplete(oiaMessage: string): boolean {
  const s = oiaMessage.toLowerCase();
  return COMPLETION_SIGNALS.some(sig => s.includes(sig));
}

// Phrases Oia says when she's confirmed a WhatsApp waitlist signup. Phase-1
// WhatsApp only does waitlist capture (name + intention), so this is the signal
// that matters most there — and join_waitlist can be dropped by a flaky model
// just like create_nia_inquiry, so we back it up the same way.
const WAITLIST_SIGNALS = [
  "you're on my list",
  'on my list now',
  'hold your place',
  'hold my place',
  'holding your place',
  'the moment a space opens',
  'the second we',
  'message you right here',
  "you're still on my list",
  'added you to',
  'on the waitlist',
];

export function looksWaitlisted(oiaMessage: string): boolean {
  const s = oiaMessage.toLowerCase();
  return WAITLIST_SIGNALS.some(sig => s.includes(sig));
}

const EXTRACT_SCHEMA_HINT = `Return ONLY a JSON object (no prose, no code fence) with these keys:
{
  "name": string|null,               // patient's first name / name
  "procedure": string|null,          // treatment they want, plain words e.g. "tummy tuck"
  "dateOfBirth": string|null,        // ISO "YYYY-MM-DD" if derivable, else null
  "countryOfResidence": string|null,
  "intent": string|null,             // one sentence: their goal
  "medicalScreening": object,        // {"diabetes":false,...} for conditions mentioned; {} if none discussed
  "photosDeclined": boolean,         // true if they declined a photo
  "aiScore": number,                 // 0-100 booking-intent estimate
  "aiPriority": "High"|"Medium"|"Low",
  "aiRationale": string              // 1-2 sentences for the team
}
If the conversation is NOT actually a real patient intake (e.g. just a greeting, a test with no procedure, or a clinic), set "procedure" to null.`;

type Extracted = {
  name: string | null;
  procedure: string | null;
  dateOfBirth: string | null;
  countryOfResidence: string | null;
  intent: string | null;
  medicalScreening: Record<string, boolean>;
  photosDeclined: boolean;
  aiScore: number;
  aiPriority: string;
  aiRationale: string;
};

async function extractFromTranscript(transcript: string): Promise<Extracted | null> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system:
      'You extract structured medical-tourism intake data from a patient⇄concierge chat transcript. ' +
      EXTRACT_SCHEMA_HINT,
    messages: [{ role: 'user', content: `Transcript:\n\n${transcript}\n\nExtract the JSON now.` }],
  });
  const text = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('').trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd < 0) return null;
  try {
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Extracted;
  } catch {
    return null;
  }
}

export type ReconcileResult =
  | { ok: true; action: 'created'; leadCreated: boolean; matched: boolean; procedure: string }
  | { ok: true; action: 'skipped'; reason: string };

/**
 * Rescue one WhatsApp session into a Lead if it's a completed intake with no Lead.
 * `origin` is this app's own base URL, used to reuse the existing intake endpoints.
 */
export async function reconcileSession(sessionId: string, origin: string): Promise<ReconcileResult> {
  const session = await db.nIASession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      surface: true,
      identifier: true,
      patientId: true,
      messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true, metadata: true } },
    },
  });
  if (!session || session.surface !== 'whatsapp') return { ok: true, action: 'skipped', reason: 'not a whatsapp session' };

  const phone = session.identifier;
  if (!phone || !phone.startsWith('+')) return { ok: true, action: 'skipped', reason: 'no phone' };

  // Already has a Lead? Nothing to rescue.
  const existingLead = await db.lead.count({ where: { consultation: { patientId: session.patientId } } });
  if (existingLead > 0) return { ok: true, action: 'skipped', reason: 'lead already exists' };

  // Already reconciled once (marker on the session's newest message metadata)? avoid loops.
  const alreadyReconciled = session.messages.some(m => {
    const meta = (m.metadata ?? {}) as Record<string, unknown>;
    return meta.reconciled === true;
  });
  if (alreadyReconciled) return { ok: true, action: 'skipped', reason: 'already reconciled' };

  // Build a clean transcript.
  const transcript = session.messages
    .filter(m => (m.content ?? '').trim())
    .map(m => `${m.role === 'PATIENT' ? 'Patient' : 'Oia'}: ${m.content.replace(/\s+/g, ' ').trim()}`)
    .join('\n');
  if (transcript.length < 40) return { ok: true, action: 'skipped', reason: 'transcript too short' };

  const data = await extractFromTranscript(transcript);
  if (!data || !data.procedure) return { ok: true, action: 'skipped', reason: 'not a matchable intake' };

  // Mark reconciled up front (idempotency) so concurrent syncs don't double-create.
  await db.nIAMessage.create({
    data: {
      sessionId: session.id,
      role: 'NIA',
      content: `[auto-reconciled intake — ${data.procedure}]`,
      metadata: { reconciled: true, source: 'reconciler' },
    },
  });

  const secret = process.env.WHATSAPP_INTAKE_SECRET ?? '';
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };

  // Create the Lead via the existing intake endpoint (reuses all its logic).
  const inquiryRes = await fetch(`${origin}/api/intake/whatsapp`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      surface: 'whatsapp',
      phone,
      name: data.name ?? phone,
      procedure: data.procedure,
      dateOfBirth: data.dateOfBirth ?? undefined,
      countryOfResidence: data.countryOfResidence ?? undefined,
      intent: data.intent ?? undefined,
      medicalScreening: data.medicalScreening ?? {},
      photosDeclined: data.photosDeclined ?? false,
      conversationTranscript: transcript,
      aiScore: typeof data.aiScore === 'number' ? data.aiScore : 60,
      aiPriority: data.aiPriority ?? 'Medium',
      aiRationale: (data.aiRationale ?? '') + ' [auto-reconciled: Oia completed intake but did not fire the tool]',
    }),
  });
  const leadCreated = inquiryRes.ok;

  // Run SmartMatch so the team has the shortlist too.
  let matched = false;
  try {
    const matchRes = await fetch(`${origin}/api/smartmatch`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ phone, procedure: data.procedure, country: data.countryOfResidence ? undefined : undefined }),
    });
    matched = matchRes.ok;
  } catch {
    /* non-fatal */
  }

  return { ok: true, action: 'created', leadCreated, matched, procedure: data.procedure };
}

// ── Waitlist safety net ──────────────────────────────────────────────────────
// Rescue a WhatsApp waitlist signup into an entry if Oia confirmed it but never
// fired join_waitlist. Same idea as reconcileSession, lighter payload.
type ExtractedWaitlist = { name: string | null; procedure: string | null; email: string | null; isWaitlist: boolean };

async function extractWaitlist(transcript: string): Promise<ExtractedWaitlist | null> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system:
      'A patient messaged a concierge to join a waitlist. Extract ONLY JSON: ' +
      '{"name":string|null,"procedure":string|null,"email":string|null,"isWaitlist":boolean}. ' +
      '"procedure" = what they said they are hoping to do / are interested in. ' +
      'Set "isWaitlist" false if this is not a real person joining a waitlist (e.g. a clinic, or just a greeting with no intention given).',
    messages: [{ role: 'user', content: `Transcript:\n\n${transcript}\n\nExtract the JSON now.` }],
  });
  const text = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('').trim();
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < 0) return null;
  try {
    return JSON.parse(text.slice(a, b + 1)) as ExtractedWaitlist;
  } catch {
    return null;
  }
}

export async function reconcileWaitlist(sessionId: string, origin: string): Promise<ReconcileResult> {
  const session = await db.nIASession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      surface: true,
      identifier: true,
      messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true, metadata: true } },
    },
  });
  if (!session || session.surface !== 'whatsapp') return { ok: true, action: 'skipped', reason: 'not a whatsapp session' };
  const phone = session.identifier;
  if (!phone || !phone.startsWith('+')) return { ok: true, action: 'skipped', reason: 'no phone' };

  // Already have a waitlist entry (from join_waitlist OR a prior reconcile)? done.
  const alreadyWaitlisted = session.messages.some(m => {
    const meta = (m.metadata ?? {}) as Record<string, unknown>;
    return meta.waitlist === true;
  });
  if (alreadyWaitlisted) return { ok: true, action: 'skipped', reason: 'already on waitlist' };

  const transcript = session.messages
    .filter(m => (m.content ?? '').trim())
    .map(m => `${m.role === 'PATIENT' ? 'Patient' : 'Oia'}: ${m.content.replace(/\s+/g, ' ').trim()}`)
    .join('\n');
  if (transcript.length < 30) return { ok: true, action: 'skipped', reason: 'transcript too short' };

  const data = await extractWaitlist(transcript);
  if (!data || !data.isWaitlist || (!data.name && !data.procedure)) {
    return { ok: true, action: 'skipped', reason: 'not a waitlist signup' };
  }

  const secret = process.env.WHATSAPP_INTAKE_SECRET ?? '';
  const res = await fetch(`${origin}/api/intake/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({
      phone,
      name: data.name ?? undefined,
      email: data.email ?? undefined,
      procedure: data.procedure ?? undefined,
      notes: 'auto-reconciled: Oia confirmed the waitlist but did not fire join_waitlist',
    }),
  });
  return { ok: true, action: 'created', leadCreated: res.ok, matched: false, procedure: data.procedure ?? '(waitlist)' };
}
