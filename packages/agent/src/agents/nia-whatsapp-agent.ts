import Anthropic from '@anthropic-ai/sdk';
import { db } from '@nia/shared/src/db.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Nia, a warm, professional, and discreet medical tourism concierge on WhatsApp. You help patients explore cosmetic and reconstructive surgery options at world-class international clinics.

## Message style — CRITICAL
- Keep every message SHORT. Maximum 2–3 sentences per reply.
- One idea per message. Do not combine multiple questions.
- Never use bullet lists or numbered lists in your replies — write naturally.
- Warm and conversational, never clinical or overwhelming.
- Use *bold* for emphasis (WhatsApp markdown). No HTML.
- Emoji only if the patient uses them first.
- No long lists — keep responses tight and human.

## Mandatory intake checklist
Collect ALL of the following before outputting <INTAKE>. Ask one thing at a time, naturally woven into conversation.

### Patient information (all required)
- Full name
- Procedure interest
- Specific goals / what they want to achieve
- Travel timeline
- Country of residence
- Preferred language (infer if obvious)
- Date of birth — ask sensitively: "Could I also ask your date of birth? It helps our surgeons confirm suitability."

### Medical screening (all 11 required — handle conversationally)
Once you have all patient information, send this exact message to collect triage:

"Before I can put together your profile, I just need to ask about a few medical conditions — it only takes a second. Please reply with the *numbers* that apply to you, or just "none" if none of these apply:

1. Diabetes
2. Active cancer treatment
3. Organ transplant (past or current)
4. DVT / blood clots
5. Pacemaker or cardiac implant
6. High blood pressure
7. Heart disease
8. Thyroid disorder
9. Immune disorder
10. Pregnant or trying to conceive
11. Severe allergies

Just reply with the numbers (e.g. "1, 4") or "none" — I'll note everything for the team."

When the patient replies, parse their answer. Acknowledge any flagged conditions naturally in one sentence, then proceed.

### Treatment area photos (required)
Ask once: "Could you send a quick photo of the area you'd like to address? It's seen only by the clinical team and helps surgeons give a much more accurate first impression."
If they decline or don't send: ask one more time gently.
After two refusals/skips, accept and proceed.

## When you may output <INTAKE>
Only when ALL of the following are true:
1. All patient information fields confirmed
2. Medical screening answered
3. At least one photo received OR patient declined twice

Confirm first: "Thank you [name], I have everything I need. Our team will review your profile and be in touch within 24–48 hours. 🤍"

Then output EXACTLY (on a new line, the patient won't see this):
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
  "aiRationale": "2–3 sentence clinical rationale"
}
</INTAKE>`;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | Anthropic.MessageParam['content'];
}

interface AgentResult {
  replies: string[];
  intakeComplete: boolean;
}

// In-memory conversation state per phone number
// TODO: replace with DB-backed persistence if server restarts become a concern
const sessions = new Map<string, ConversationMessage[]>();

export class NiaWhatsAppAgent {
  async run(phone: string, text: string, mediaUrl?: string): Promise<AgentResult> {
    const history = sessions.get(phone) ?? [];

    // Build the user turn content
    let userContent: Anthropic.MessageParam['content'];
    if (mediaUrl) {
      const imageBase64 = await downloadImageAsBase64(mediaUrl);
      if (imageBase64) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          ...(text.trim() ? [{ type: 'text' as const, text: text.trim() }] : [{ type: 'text' as const, text: '(Patient sent a photo)' }]),
        ];
      } else {
        userContent = text.trim() || '(Patient sent a photo — download failed)';
      }
    } else {
      userContent = text.trim();
    }

    const newUserMsg: ConversationMessage = { role: 'user', content: userContent };
    const updatedHistory = [...history, newUserMsg];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: updatedHistory as Anthropic.MessageParam[],
    });

    const fullText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('');

    // Persist the new messages
    const assistantMsg: ConversationMessage = { role: 'assistant', content: fullText };
    sessions.set(phone, [...updatedHistory, assistantMsg]);

    // Check for <INTAKE> block
    const intakeMatch = fullText.match(/<INTAKE>([\s\S]*?)<\/INTAKE>/);
    if (intakeMatch) {
      const visibleText = fullText.replace(/<INTAKE>[\s\S]*?<\/INTAKE>/, '').trim();
      const clinicMessages = await handleIntakeComplete(phone, intakeMatch[1]);
      return {
        replies: [visibleText, ...clinicMessages].filter(Boolean),
        intakeComplete: true,
      };
    }

    return { replies: [fullText], intakeComplete: false };
  }
}

async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch {
    return null;
  }
}

async function handleIntakeComplete(phone: string, intakeJson: string): Promise<string[]> {
  const messages: string[] = [];

  // 1. Save intake to dashboard
  try {
    const intake = JSON.parse(intakeJson.trim());
    intake.phone = phone;
    intake.surface = 'whatsapp';

    const secret = process.env.WHATSAPP_INTAKE_SECRET;
    if (secret) {
      const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://nia-medtourism-dashboard.vercel.app';
      await fetch(`${dashboardUrl}/api/intake/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(intake),
      });
    }
  } catch {
    // Non-fatal — continue to send clinic cards
  }

  // 2. Fetch matching clinics
  try {
    const procedure = extractProcedure(intakeJson);
    const clinics = await fetchMatchedClinics(procedure);

    if (clinics.length === 0) {
      messages.push(
        "Our team is curating the best options for your profile and will be in touch within 24–48 hours with personalised clinic recommendations. 🤍",
      );
      return messages;
    }

    messages.push(
      `While our team reviews your profile, here are ${clinics.length} clinic${clinics.length > 1 ? 's' : ''} that match your needs:`,
    );

    for (const clinic of clinics) {
      messages.push(formatClinicMessage(clinic));
    }

    messages.push(
      "Have a question about any of these? Just ask — I'm here. A dedicated concierge from our team will also follow up with you shortly. 🤍",
    );
  } catch {
    messages.push(
      "Our team will follow up with personalised clinic recommendations within 24–48 hours.",
    );
  }

  return messages;
}

function extractProcedure(intakeJson: string): string {
  try {
    const data = JSON.parse(intakeJson.trim());
    return (data.procedure as string) ?? '';
  } catch {
    return '';
  }
}

interface ClinicResult {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string | null;
  niaScore: number | null;
  accreditations: string[];
  specialties: string[];
  website: string | null;
}

async function fetchMatchedClinics(procedure: string): Promise<ClinicResult[]> {
  const where = procedure.trim()
    ? {
        isActive: true,
        isVerified: true,
        specialties: { hasSome: [procedure] },
      }
    : { isActive: true, isVerified: true };

  const clinics = await (db.clinic as any).findMany({
    where,
    orderBy: { niaScore: 'desc' },
    take: 3,
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      description: true,
      niaScore: true,
      accreditations: true,
      specialties: true,
      website: true,
    },
  });

  if (clinics.length === 0 && procedure.trim()) {
    return (db.clinic as any).findMany({
      where: { isActive: true, isVerified: true },
      orderBy: { niaScore: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        description: true,
        niaScore: true,
        accreditations: true,
        specialties: true,
        website: true,
      },
    });
  }

  return clinics;
}

function formatClinicMessage(clinic: ClinicResult): string {
  const lines: string[] = [];
  lines.push(`*${clinic.name}*`);
  lines.push(`📍 ${clinic.city}, ${clinic.country}`);
  if (clinic.niaScore) lines.push(`⭐ NIA Score: ${clinic.niaScore}/10`);
  if (clinic.accreditations?.length) lines.push(`✅ ${clinic.accreditations.join(' · ')}`);
  if (clinic.description) lines.push(clinic.description.slice(0, 120) + (clinic.description.length > 120 ? '…' : ''));
  if (clinic.website) lines.push(`🌐 ${clinic.website}`);
  return lines.join('\n');
}
