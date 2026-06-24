import OpenAI from 'openai';
import { z } from 'zod';

const IntentSchema = z.object({
  procedure: z.string().nullable(),
  location: z.string().nullable(),
  stage: z.enum(['exploring', 'ready', 'post_op']).default('exploring'),
  isImageMatch: z.boolean().default(false),
  needsEscalation: z.boolean().default(false),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

const SYSTEM_PROMPT = `You are NIA, a calm and warm AI concierge for cosmetic medical tourism.

Extract the patient's intent from their message. Return ONLY valid JSON matching this schema:
{
  "procedure": string | null,        // e.g. "rhinoplasty", "facelift", "BBL", "liposuction", "breast augmentation"
  "location": string | null,         // city or country they mentioned, e.g. "Istanbul", "Turkey"
  "stage": "exploring" | "ready" | "post_op",  // how far along they are
  "isImageMatch": boolean,           // true if they're sharing a photo for matching
  "needsEscalation": boolean         // true if they express strong distress, medical emergency, or complaint
}

If a field cannot be determined, use null. procedure must be one of the V1 procedures if mentioned: rhinoplasty, facelift, BBL, liposuction, breast augmentation. Otherwise use the closest match or null.`;

export class IntentAgent {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
    this.model = process.env.NIA_MODEL ?? 'gpt-4o-mini';
  }

  async parse(message: string): Promise<ParsedIntent> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message.content ?? '{}';
    const parsed = JSON.parse(raw);
    return IntentSchema.parse(parsed);
  }
}
