import Anthropic from '@anthropic-ai/sdk';
import { db } from '@nia/shared/src/db';
import { WAITLIST_MODE } from '@/lib/waitlist';
import { verifyInviteToken } from '@nia/shared/src/inviteToken';
// Oia's web operating layer, loaded from editable Markdown (packages/shared/src/oia/web-intake.md).
import WEB_INTAKE from '@nia/shared/src/oia/web-intake.md';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Provider switch. Default 'anthropic' (Sonnet 4.6). Prod runs on Qwen3-VL 235B
// via OpenRouter (WEB_LLM_PROVIDER=qwen + OPENROUTER_API_KEY set on Vercel, 2026-07-09)
// — vision-capable, far cheaper than Sonnet. Unset the env to fall back to Sonnet.
const WEB_LLM = (process.env.WEB_LLM_PROVIDER ?? 'anthropic').toLowerCase();
const QWEN_MODEL = 'qwen/qwen3-vl-235b-a22b-instruct';

const SYSTEM_PROMPT = WEB_INTAKE;

// Waitlist mode: Oia is at capacity, so instead of the full clinical intake she
// collects light "stay in touch" details and logs them via a <WAITLIST> block.
const WAITLIST_SYSTEM_PROMPT = `You are Oia, a warm, honest, discreet concierge for cosmetic and plastic surgery — the knowing friend who happens to live in this world.

## Context — you are at capacity (READ THIS FIRST)
Oia is currently full: we care for 50 patients at a time and that capacity has been reached. The patient has just been shown this, together with a green "Continue on WhatsApp" button below the chat. **The best way for them to join the waitlist is to tap that WhatsApp button** — it opens a conversation with you on WhatsApp, which is how you'll reach them the moment a place opens. You are NOT doing a full medical intake, NOT matching them to surgeons, NOT discussing specific clinics or prices.

- If they type here instead of tapping the button, warmly point them to it: *"The quickest way for me to keep in touch is the green WhatsApp button just below — tap it and I'll be right there with you. 🤍"*
- If they'd genuinely rather not use WhatsApp, then (and only then) offer to take their name and a contact (email or number) here, confirm they're on the list, and emit the <WAITLIST> block below.
- Keep every message short and warm — 2–3 sentences, no lists, no emojis unless they use them.

## Who you are / voice
- Speak as "I" — warm, human, never judgemental. You are openly an AI, and that's your strength.
- British English throughout.
- Keep every message SHORT — 2–3 sentences max, one idea per message. No lists. No emojis unless the patient uses them first.
- Acknowledge a feeling before you ask the next thing.

## What to collect (one at a time, naturally — never as a checklist)
1. Their name
2. Their WhatsApp number — so the team can reach them the moment a place opens
3. Their age
4. The procedure they're interested in
5. Anything else about what they'd like help with

If they give several at once, don't re-ask. Weave it into a brief, warm conversation.

## Grounding — never invent (CRITICAL)
- NEVER quote a price, cost, or range, in any currency. NEVER name a specific clinic or surgeon.
- Don't promise WHEN a place will open — just that you'll be in touch as soon as you can.
- Never give medical advice or play doctor.

## When you have their name, WhatsApp number, age AND procedure
Warmly confirm they're on the list and you'll be in touch as soon as a place opens. Then output EXACTLY, on its own line, with NO markdown and NO code fences:
<WAITLIST>
{
  "name": "...",
  "whatsapp": "...",
  "age": "...",
  "procedure": "...",
  "notes": "..."
}
</WAITLIST>
- "whatsapp" is their number exactly as given; "notes" is anything else they shared (or "").

## What NOT to do
- Never output <WAITLIST> until you have at least name, WhatsApp number, age and procedure.
- Never ask for date of birth, medical conditions, or photos — this is a light waitlist, not a full intake.
- Never show clinics, matches, galleries, or prices.
- Never write long paragraphs.`;

function extractWaitlist(text: string): { clean: string; json: Record<string, unknown> | null } {
  const match = text.match(/<WAITLIST>([\s\S]*?)<\/WAITLIST>/);
  if (!match) return { clean: text, json: null };
  const clean = text.replace(/<WAITLIST>[\s\S]*?<\/WAITLIST>/, '').trim();
  try {
    return { clean, json: JSON.parse(match[1].trim()) };
  } catch {
    return { clean, json: null };
  }
}

function extractIntake(text: string): { clean: string; json: Record<string, unknown> | null } {
  const match = text.match(/<INTAKE>([\s\S]*?)<\/INTAKE>/);
  if (!match) return { clean: text, json: null };
  const clean = text.replace(/<INTAKE>[\s\S]*?<\/INTAKE>/, '').trim();
  try {
    return { clean, json: JSON.parse(match[1].trim()) };
  } catch {
    return { clean, json: null };
  }
}

function extractTriage(text: string): { clean: string; showTriage: boolean } {
  const hasTriage = /<TRIAGE\s*\/>/.test(text);
  const clean = text.replace(/<TRIAGE\s*\/>/, '').trim();
  return { clean, showTriage: hasTriage };
}

function extractGallery(text: string): { clean: string; gallery: string | null } {
  const match = text.match(/<GALLERY\s+procedure="([^"]+)"\s*\/>/);
  const clean = text.replace(/<GALLERY\s+procedure="[^"]+"\s*\/>/, '').trim();
  return { clean, gallery: match?.[1] ?? null };
}

function extractPhotos(text: string): { clean: string; photosProcedure: string | null } {
  const match = text.match(/<PHOTOS\s+procedure="([^"]+)"\s*\/>/);
  const clean = text.replace(/<PHOTOS\s+procedure="[^"]+"\s*\/>/, '').trim();
  return { clean, photosProcedure: match?.[1] ?? null };
}

function extractClinics(text: string): { clean: string; showClinics: boolean } {
  const show = /<CLINICS\s*\/>/.test(text);
  const clean = text.replace(/<CLINICS\s*\/>/, '').trim();
  return { clean, showClinics: show };
}

type HistoryItem = { role: 'user' | 'assistant'; content: string };
type PhotoItem = { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; angle?: string };

// ── LLM providers ────────────────────────────────────────────────────────────
// Both yield plain text deltas so the streaming + tag-parsing loop below is
// provider-agnostic. Anthropic path is byte-identical to before.

async function* anthropicDeltas(system: string, messages: Anthropic.MessageParam[]) {
  const claudeStream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages,
  });
  for await (const event of claudeStream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function* qwenDeltas(system: string, openaiMessages: any[]) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'system', content: system }, ...openaiMessages],
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`OpenRouter ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const data = t.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const j = JSON.parse(data);
        const piece = j.choices?.[0]?.delta?.content;
        if (piece) yield piece as string;
      } catch {
        // keepalive / partial line — ignore
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logTurn(sessionId: string, patientMessage: string, niaResponse: string, metadata?: any) {
  try {
    // Upsert an anonymous web session — no patient account required
    await db.nIASession.upsert({
      where: { surface_identifier: { surface: 'web', identifier: sessionId } },
      create: {
        surface: 'web',
        identifier: sessionId,
        lastActiveAt: new Date(),
        // anonymous patient placeholder — reused across web sessions
        patient: {
          connectOrCreate: {
            where: { whatsappNumber: `web_anon_${sessionId}` },
            create: {
              whatsappNumber: `web_anon_${sessionId}`,
              user: {
                create: {
                  email: `anon_${sessionId}@web.nia.health`,
                  name: 'Web visitor',
                  role: 'PATIENT',
                },
              },
            },
          },
        },
      },
      update: { lastActiveAt: new Date() },
    });

    const session = await db.nIASession.findUnique({
      where: { surface_identifier: { surface: 'web', identifier: sessionId } },
    });
    if (!session) return;

    await db.nIAMessage.createMany({
      data: [
        { sessionId: session.id, role: 'PATIENT', content: patientMessage },
        { sessionId: session.id, role: 'NIA', content: niaResponse, ...(metadata ? { metadata } : {}) },
      ],
    });
  } catch (err) {
    // Non-fatal — logging failures must never break the chat
    console.error('[chat:log]', err);
  }
}

export async function POST(req: Request) {
  const { message, history = [], patientName, photos = [], sessionId, invite } = await req.json() as {
    message: string;
    history?: HistoryItem[];
    patientName?: string;
    photos?: PhotoItem[];
    sessionId?: string;
    invite?: string;
  };

  // Invited-back-from-waitlist patient: a valid invite token opens the FULL
  // intake (bypassing WAITLIST_MODE) prefilled with their name + intention.
  const invited = invite ? verifyInviteToken(invite) : null;

  if (!message?.trim() && photos.length === 0) {
    return new Response('Bad request', { status: 400 });
  }

  // Store photos in the dashboard's PRIVATE Blob store (same path as WhatsApp) —
  // the dashboard owns the store, so web routes bytes through its intake endpoint
  // rather than uploading public blobs itself.
  const photoUrls: string[] = [];
  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://oia-dashboard-beryl.vercel.app';
  const intakeSecret = process.env.WHATSAPP_INTAKE_SECRET;
  for (const photo of photos) {
    try {
      const bytes = Buffer.from(photo.base64, 'base64');
      const ext = (photo.mediaType.split('/')[1] ?? 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
      // angle label (e.g. left_profile) so the surgeon gets angle-tagged photos.
      const angleParam = photo.angle ? `&angle=${encodeURIComponent(photo.angle)}` : '';
      const res = await fetch(`${dashboardUrl}/api/intake/photo?sessionId=${encodeURIComponent(sessionId ?? 'anon')}&ext=${ext}${angleParam}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${intakeSecret}`, 'Content-Type': photo.mediaType },
        body: bytes,
      });
      const data = await res.json();
      if (data?.url) photoUrls.push(data.url);
      else console.error('[chat:photo] upload failed', data);
    } catch (err) {
      console.error('[chat:photo]', err);
    }
  }

  const photoNote = photos.length > 0
    ? `[Patient shared ${photos.length} photo${photos.length > 1 ? 's' : ''} of their treatment area]`
    : '';

  const systemPrompt = invited
    ? `${SYSTEM_PROMPT}\n\nNote: ${invited.name || 'This patient'} was on the waitlist and a space has now opened for their ${invited.procedure || 'procedure'} — they've followed their private invite link back. You ALREADY know their name (${invited.name || 'unknown'}) and what they want (${invited.procedure || 'unknown'}), so do NOT ask for either. Greet them warmly by name, acknowledge their space opened for their ${invited.procedure || 'procedure'}, and proceed straight into the streamlined intake (local-or-travel preference, where they're based, photos, age, medical screening) to get them matched — do NOT ask about goals or timeline. When intake is complete, close by telling them you're now putting their personalised surgeon matches together and will bring them their options here — never say a team will "review" their profile and never give a 24–48 hour timeline; they are a priority patient and the tone is active momentum toward their matches.`
    : WAITLIST_MODE
    ? WAITLIST_SYSTEM_PROMPT
    : patientName && patientName !== 'there'
    ? `${SYSTEM_PROMPT}\n\nNote: This patient's name is ${patientName}. You already have their name — greet them warmly by name and skip the name question.`
    : SYSTEM_PROMPT;

  // Build the provider-specific message list + delta stream.
  let deltas: AsyncGenerator<string>;
  if (WEB_LLM === 'qwen') {
    // OpenAI/OpenRouter shape. Images ride as data-URI image_url parts (Qwen-VL).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: any = photos.length > 0
      ? {
          role: 'user',
          content: [
            ...photos.map(p => ({ type: 'image_url', image_url: { url: `data:${p.mediaType};base64,${p.base64}` } })),
            { type: 'text', text: message?.trim() || photoNote },
          ],
        }
      : { role: 'user', content: message };
    const openaiMessages = [...history.map(h => ({ role: h.role, content: h.content })), current];
    deltas = qwenDeltas(systemPrompt, openaiMessages);
  } else {
    const userContent: Anthropic.ContentBlockParam[] = [];
    for (const photo of photos) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: photo.mediaType, data: photo.base64 },
      });
    }
    if (message?.trim()) userContent.push({ type: 'text', text: message });
    else if (photos.length > 0) userContent.push({ type: 'text', text: photoNote });

    const messages: Anthropic.MessageParam[] = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userContent },
    ];
    deltas = anthropicDeltas(systemPrompt, messages);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = '';

      try {
        for await (const piece of deltas) {
          fullText += piece;
          // Hide all sentinel tags from the streaming text shown to the patient
          const visibleText = fullText
            .replace(/<INTAKE>[\s\S]*$/, '')
            .replace(/<WAITLIST>[\s\S]*$/, '')
            .replace(/<TRIAGE\s*\/>/, '')
            .replace(/<PHOTOS\s+procedure="[^"]+"\s*\/>/, '')
            .replace(/<GALLERY\s+procedure="[^"]+"\s*\/>/, '')
            .replace(/<CLINICS\s*\/>/, '');
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'delta', text: piece, visibleLength: visibleText.length })}\n\n`
          ));
        }

        const { clean: cleanIntake, json } = extractIntake(fullText);
        const { clean: cleanTriage, showTriage } = extractTriage(cleanIntake);
        const { clean: cleanPhotos, photosProcedure } = extractPhotos(cleanTriage);
        const { clean: cleanGallery, gallery } = extractGallery(cleanPhotos);
        const { clean: cleanClinics, showClinics } = extractClinics(cleanGallery);
        const { clean, json: waitlist } = extractWaitlist(cleanClinics);

        // Deterministic TRIAGE net: Qwen often ANNOUNCES the medical form without
        // emitting <TRIAGE/> (it narrates instead of executing — the same failure
        // mode as the skipped <INTAKE>). If this turn reads like the medical-screening
        // step, photos are already behind us, and the form hasn't been shown/answered,
        // force the form open — the widget must never depend on the model's token.
        const inFullIntake = !!invited || !WAITLIST_MODE;
        const triageAnswered =
          /medical screening answers/i.test(message ?? '') ||
          history.some(h => h.role === 'user' && /medical screening answers/i.test(h.content));
        const photosBehindUs =
          /photos shared|chose to skip sharing photos/i.test(message ?? '') ||
          history.some(h => /photos shared — the patient uploaded|chose to skip sharing photos/i.test(h.content));
        const announcesTriage =
          /(safety|medical|health)[^.!?\n]{0,60}(form|questions|screening|check)|form to complete|screening form|11 (health )?(questions|conditions)/i.test(clean);
        const showTriageFinal = showTriage ||
          (inFullIntake && !photosProcedure && !json && !triageAnswered && photosBehindUs && announcesTriage);

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done', intakeComplete: !!json, showTriage: showTriageFinal, photosProcedure, gallery, showClinics, waitlistComplete: !!waitlist, fullText: clean, intake: json })}\n\n`
        ));

        // Persist the turn BEFORE closing the stream. On serverless (Vercel) the
        // function is frozen once the response ends, so a fire-and-forget write
        // often never lands — which broke conversation resume. Awaiting guarantees
        // the messages are saved so the chat can be reloaded after a close/refresh.
        if (sessionId && (message?.trim() || photoUrls.length > 0)) {
          const patientText = message.trim() || `[${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''} shared]`;
          const logMeta = waitlist
            ? { waitlist: true, ...waitlist, ...(photoUrls.length > 0 ? { photoUrls } : {}) }
            : json
            ? { intakeComplete: true, ...json, photoUrls }
            : photoUrls.length > 0 ? { photoUrls } : undefined;
          await logTurn(sessionId, patientText, clean, logMeta);
        }
      } catch (err) {
        console.error('[chat]', err);
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: 'Something went wrong. Please try again.' })}\n\n`
        ));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
