import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// The sidecar reports an outbound message as sent (or failed). Flips the queued
// invite's status so it isn't re-sent. Auth: shared WhatsApp secret.
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messageId?: string; ok?: boolean; error?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

  const msg = await db.nIAMessage.findUnique({ where: { id: body.messageId }, select: { metadata: true } });
  if (!msg) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const meta = (msg.metadata ?? {}) as Record<string, unknown>;

  await db.nIAMessage.update({
    where: { id: body.messageId },
    data: {
      metadata: {
        ...meta,
        inviteStatus: body.ok === false ? 'failed' : 'sent',
        inviteSentAt: new Date().toISOString(),
        ...(body.error ? { inviteError: body.error } : {}),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
