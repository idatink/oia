import { NextResponse } from 'next/server';
import { mintMatchToken } from '@/lib/matchToken';

export const dynamic = 'force-dynamic';

// Mint a private match-room link for a patient. Called by Oia (web + the WhatsApp
// match_room skill) when a patient wants to browse all their matches / other
// countries. Returns a signed, unguessable URL: /matches/<token>.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const procedure = searchParams.get('procedure')?.trim();
  if (!procedure) {
    return NextResponse.json({ error: 'procedure is required' }, { status: 400 });
  }
  const token = mintMatchToken({
    procedure,
    country: searchParams.get('country') ?? undefined,
    name: searchParams.get('name') ?? undefined,
  });
  const origin = process.env.WEB_PUBLIC_URL ?? new URL(req.url).origin;
  return NextResponse.json({ token, path: `/matches/${token}`, url: `${origin}/matches/${token}` });
}
