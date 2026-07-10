import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// Queued outbound messages for the Fly sidecar to send via Oia (WhatsApp).
// Currently: waitlist "invite back to web" messages (metadata.inviteStatus='queued').
// Auth: shared WhatsApp secret (same as the sidecar's other calls).
export async function GET(req: Request) {
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.nIAMessage.findMany({
    where: { role: 'NIA', metadata: { path: ['inviteStatus'], equals: 'queued' } },
    select: { id: true, metadata: true, session: { select: { identifier: true } } },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  const pending = rows
    .map(r => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const phone = ((meta.whatsapp as string) || r.session?.identifier || '').replace(/\s+/g, '');
      const message = (meta.inviteMessage as string) || '';
      return phone && message ? { messageId: r.id, phone, message } : null;
    })
    .filter(Boolean);

  return NextResponse.json({ pending });
}
