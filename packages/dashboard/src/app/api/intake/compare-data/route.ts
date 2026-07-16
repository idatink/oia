import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// Serves a compare record to the WEB compare page. The web server verifies the
// signed /compare/<token> first, then calls here with the shared secret + the
// token's {id, phone} — so entries are only ever served for a matching pair.
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id || !body.phone) return NextResponse.json({ error: 'id + phone required' }, { status: 400 });

  const msg = await db.nIAMessage.findUnique({
    where: { id: body.id },
    select: { metadata: true, createdAt: true, session: { select: { identifier: true } } },
  });
  const meta = (msg?.metadata ?? {}) as Record<string, unknown>;
  if (!msg || meta.compare !== true || msg.session?.identifier !== body.phone.replace(/\s+/g, '')) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    procedure: (meta.procedure as string) ?? null,
    name: (meta.name as string) ?? null,
    entries: (meta.entries as unknown[]) ?? [],
    createdAt: msg.createdAt,
  });
}
