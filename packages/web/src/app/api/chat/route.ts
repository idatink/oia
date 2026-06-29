import Anthropic from '@anthropic-ai/sdk';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Nia, a warm, professional, and discreet medical tourism concierge. You help patients explore cosmetic and reconstructive surgery options at world-class international clinics.

## Message style — CRITICAL
- Keep every message SHORT. Maximum 2–3 sentences per reply.
- One idea per message. Do not combine multiple questions.
- Never use bullet lists or numbered lists in your replies — write naturally.
- Warm and conversational, never clinical or overwhelming.
- No emojis unless the patient uses them first.

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

async function logTurn(sessionId: string, patientMessage: string, niaResponse: string, metadata?: Record<string, unknown>) {
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
        { sessionId: session.id, role: 'NIA', content: niaResponse, metadata: metadata ?? null },
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

  // Build the current user message content — may include images
  const userContent: Anthropic.ContentBlockParam[] = [];

  for (const photo of photos) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: photo.mediaType,
        data: photo.base64,
      },
    });
  }

  if (message?.trim()) {
    userContent.push({ type: 'text', text: message });
  } else if (photos.length > 0) {
    userContent.push({ type: 'text', text: `[Patient shared ${photos.length} photo${photos.length > 1 ? 's' : ''} of their treatment area]` });
  }

  // Build messages array from client-provided history
  const messages: Anthropic.MessageParam[] = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userContent },
  ];

  const systemPrompt = patientName && patientName !== 'there'
    ? `${SYSTEM_PROMPT}\n\nNote: This patient's name is ${patientName}. You already have their name — greet them warmly by name and skip the name question.`
    : SYSTEM_PROMPT;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = '';

      try {
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            // Hide all sentinel tags from the streaming text shown to the patient
            const visibleText = fullText
              .replace(/<INTAKE>[\s\S]*$/, '')
              .replace(/<TRIAGE\s*\/>/, '')
              .replace(/<GALLERY\s+procedure="[^"]+"\s*\/>/, '')
              .replace(/<CLINICS\s*\/>/, '');
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'delta', text: event.delta.text, visibleLength: visibleText.length })}\n\n`
            ));
          }
        }

        const { clean: cleanIntake, json } = extractIntake(fullText);
        const { clean: cleanTriage, showTriage } = extractTriage(cleanIntake);
        const { clean: cleanGallery, gallery } = extractGallery(cleanTriage);
        const { clean, showClinics } = extractClinics(cleanGallery);

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done', intakeComplete: !!json, showTriage, gallery, showClinics, fullText: clean, intake: json })}\n\n`
        ));

        // Log the turn async — do not await so stream closes immediately
        if (sessionId && message?.trim()) {
          const patientText = message.trim();
          const logMeta = json ? { intakeComplete: true, ...json } : undefined;
          logTurn(sessionId, patientText, clean, logMeta as Record<string, unknown> | undefined);
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
