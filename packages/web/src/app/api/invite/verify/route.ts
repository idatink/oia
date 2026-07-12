import { NextResponse } from 'next/server';
import { verifyInviteToken } from '@nia/shared/src/inviteToken';

export const dynamic = 'force-dynamic';

// Verify an "invite back to web" token so the concierge can open the full intake
// (bypassing the capacity gate) prefilled with the patient's name + intention.
export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const data = verifyInviteToken(body.token ?? '');
  if (!data) return NextResponse.json({ valid: false });
  // phone is safe to return: the token payload is signed but not encrypted, so
  // the holder of the link can already read it — the web app uses it to
  // auto-register the invited patient without re-asking for their WhatsApp number.
  return NextResponse.json({ valid: true, name: data.name ?? null, procedure: data.procedure ?? null, phone: data.phone });
}
