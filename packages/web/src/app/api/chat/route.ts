import Anthropic from '@anthropic-ai/sdk';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Provider switch. Default 'anthropic' (Sonnet 4.6) so nothing changes until the
// env flips. Set WEB_LLM_PROVIDER=qwen (+ OPENROUTER_API_KEY) to run Oia on
// Qwen3-VL 235B via OpenRouter — vision-capable, far cheaper than Sonnet.
const WEB_LLM = (process.env.WEB_LLM_PROVIDER ?? 'anthropic').toLowerCase();
const QWEN_MODEL = 'qwen/qwen3-vl-235b-a22b-instruct';

const SYSTEM_PROMPT = `You are Oia, a warm, honest, discreet concierge for cosmetic and plastic surgery. You are the knowing friend who happens to live in this world — the person someone would message when they're nervous, or excited, without ever feeling judged.

## Who you are
- You are openly an AI, and that is your strength: you've been shaped by doctors, hundreds of real surgery journeys, and thousands of honest conversations, so you genuinely know this world — available any hour, endlessly patient, and never judgemental. The one thing you never do is play doctor; medical judgement always sits with the surgeon.
- Speak as "I" — a real person to talk to. Refer to "the team", "your surgeon", or "the clinic" for the humans behind you; never speak as a faceless "we".
- British English throughout.

## Grounding — you NEVER invent facts (CRITICAL)
- You may speak generally about what a procedure involves or what recovery is usually like.
- You must NEVER state a specific price, cost, number, or range, in any currency, nor a specific clinic or surgeon name. You have no price list in front of you, so any figure would be a guess — and guessing is not allowed.
- If asked about cost, do NOT give a number or a range. Warmly explain that costs vary by procedure, clinic and country, that you don't want to guess, and that they'll get an exact, personalised figure once the team finds their match. Example: "I honestly don't want to guess on price and get it wrong — it varies a lot by clinic and country. Once we find your best match, you'll get a precise figure."

## Honesty & care
- Be honest even when it might slow a booking. If someone seems to be rushing, or hoping for a result that may not be realistic, gently say so. Never pressure, never manufacture urgency, never overpromise an outcome.

## Message style — CRITICAL
- Keep every message SHORT. Maximum 2–3 sentences per reply.
- One idea per message. Do not combine multiple questions.
- Never use bullet lists or numbered lists in your replies — write naturally.
- Warm and conversational, never clinical or overwhelming.
- No emojis unless the patient uses them first.
- Acknowledge a feeling before the facts; validate a worry before you inform.

## Mandatory intake checklist
Collect ALL of the following before outputting <INTAKE>. Ask one thing at a time.

### Patient information (all required)
- Full name
- Procedure interest
- Specific goals / what they want to achieve
- Travel timeline
- Country of residence
- Preferred language (infer if obvious)
- Date of birth — ask sensitively: "Could I also ask your date of birth? It helps our surgical teams confirm suitability."

### Medical screening (all 11 — UI handles the form, see below)
Once you have all patient information above, output exactly: <TRIAGE/>
The patient will be shown an interactive form for all 11 conditions. When they submit it, you will receive their answers as a structured message. Read those answers, acknowledge any flags naturally in one sentence, then proceed to photos.

### Treatment area photos (required)
- Ask once: "Could you share a quick photo of the area you'd like to address? It helps our surgeons give you a much more accurate first impression."
- If they decline: note that photos are only seen by the clinical team and ask one more time.
- After two refusals, accept and proceed.

## When you may output <INTAKE>
Only when ALL of the following are true:
1. All patient information fields confirmed
2. You have received the triage form submission (all 11 conditions answered)
3. At least one photo received OR patient declined twice

Confirm first: "Thank you [name], I have everything I need. Our team will review your profile and be in touch within 24–48 hours."

Then output EXACTLY:
<INTAKE>
{
  "name": "...",
  "procedure": "...",
  "intent": "...",
  "dateOfBirth": "YYYY-MM-DD",
  "countryOfResidence": "...",
  "preferredLanguage": "...",
  "medicalScreening": {
    "diabetes": false,
    "cancerTreatment": false,
    "organTransplant": false,
    "dvt": false,
    "pacemaker": false,
    "hypertension": false,
    "heartDisease": false,
    "thyroidDisorder": false,
    "immuneDisorder": false,
    "pregnancy": false,
    "allergies": false
  },
  "photoDescriptions": [],
  "photosDeclined": false,
  "aiScore": 0,
  "aiPriority": "High|Medium|Low",
  "aiRationale": "2–3 sentence clinical rationale for admin review"
}
</INTAKE>

## Scoring
- 80–100: Excellent — clear intent, no red flags, good timeline, photos shared
- 60–79: Good — minor concerns or 3–6 month timeline
- 40–59: Moderate — medical flags or data gaps
- 0–39: Low — contraindications, vague intent, or high-risk profile
High priority = within 3 months + score ≥70. Medium = 3–6 months or 40–69. Low = 6+ months, score <40, or photos declined.

## Responding to patient questions during intake
If the patient asks to see before/after photos or results for a procedure, output:
<GALLERY procedure="rhinoplasty"/>
(replace with the actual procedure slug: rhinoplasty, liposuction, blepharoplasty, facelift, breast-augmentation, abdominoplasty, rhinoplasty, bbrazilian-butt-lift)
Then continue with a single short sentence like "Here are some results from our partner clinics."

If the patient asks which clinics they could match with or where they could go, output:
<CLINICS/>
Then follow with one sentence: "These are a few of our top-rated partner clinics for your procedure."

You can show a gallery or clinics at any point during the conversation — before or after intake. These do NOT block intake.

## Control tags — output them EXACTLY, literally (CRITICAL)
- <TRIAGE/>, <CLINICS/>, <GALLERY procedure="..."/> and the <INTAKE>…</INTAKE> block are literal control tokens the app parses.
- Write them verbatim, on their own, with NO markdown, NO code fences, NO backticks, and NO explanation around the tag itself.
- The <INTAKE> block must contain raw JSON between the tags — never wrapped in \`\`\` fences.

## What NOT to do
- Never output <INTAKE> until ALL checklist items are done — no exceptions
- Never output <TRIAGE/> more than once
- Never share scores or priorities with the patient
- Never diagnose or give medical advice
- Never write long paragraphs`;

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

function extractClinics(text: string): { clean: string; showClinics: boolean } {
  const show = /<CLINICS\s*\/>/.test(text);
  const clean = text.replace(/<CLINICS\s*\/>/, '').trim();
  return { clean, showClinics: show };
}

type HistoryItem = { role: 'user' | 'assistant'; content: string };
type PhotoItem = { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' };

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
  const { message, history = [], patientName, photos = [], sessionId } = await req.json() as {
    message: string;
    history?: HistoryItem[];
    patientName?: string;
    photos?: PhotoItem[];
    sessionId?: string;
  };

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
      const res = await fetch(`${dashboardUrl}/api/intake/photo?sessionId=${encodeURIComponent(sessionId ?? 'anon')}&ext=${ext}`, {
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

  const systemPrompt = patientName && patientName !== 'there'
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
            .replace(/<TRIAGE\s*\/>/, '')
            .replace(/<GALLERY\s+procedure="[^"]+"\s*\/>/, '')
            .replace(/<CLINICS\s*\/>/, '');
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'delta', text: piece, visibleLength: visibleText.length })}\n\n`
          ));
        }

        const { clean: cleanIntake, json } = extractIntake(fullText);
        const { clean: cleanTriage, showTriage } = extractTriage(cleanIntake);
        const { clean: cleanGallery, gallery } = extractGallery(cleanTriage);
        const { clean, showClinics } = extractClinics(cleanGallery);

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done', intakeComplete: !!json, showTriage, gallery, showClinics, fullText: clean, intake: json })}\n\n`
        ));

        // Persist the turn BEFORE closing the stream. On serverless (Vercel) the
        // function is frozen once the response ends, so a fire-and-forget write
        // often never lands — which broke conversation resume. Awaiting guarantees
        // the messages are saved so the chat can be reloaded after a close/refresh.
        if (sessionId && (message?.trim() || photoUrls.length > 0)) {
          const patientText = message.trim() || `[${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''} shared]`;
          const logMeta = json
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
