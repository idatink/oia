import { NextResponse } from 'next/server';
import { reconcileSession } from '@/lib/reconcile-intake';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // extraction + two self-calls

// Rescue a completed-but-unregistered WhatsApp intake into a Lead. Called
// fire-and-forget from /api/intake/message when Oia signals completion but no
// Lead exists, and available for a manual/admin sweep. Auth: shared secret.
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const origin = new URL(req.url).origin;
  try {
    const result = await reconcileSession(body.sessionId, origin);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
