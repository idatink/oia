import { NextResponse } from 'next/server';
import { smartMatch, type PatientProfile } from '@nia/shared/src/smartmatch';

export const dynamic = 'force-dynamic';

// SmartMatch: given a patient profile, return the ranked provider shortlist.
// Called by Oia's `smart_match` skill (WhatsApp). The web concierge calls
// smartMatch() directly server-side, so this endpoint is for the gateway.
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PatientProfile & { limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await smartMatch(body, Math.min(body.limit ?? 3, 5));
  return NextResponse.json(result);
}
