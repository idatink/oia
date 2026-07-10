import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { mintInviteToken } from '@nia/shared/src/inviteToken';
import { getAdminOrCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const WEB_URL = (process.env.NIA_WEB_URL ?? 'https://oia-web-eight.vercel.app').replace(/\/+$/, '');

// "Mark ready" → invite a waitlisted patient back to the WEB experience. Mints a
// signed invite link that opens their full intake (bypassing the capacity gate)
// prefilled, composes the WhatsApp message, and QUEUES it on the waitlist entry's
// metadata. The Fly sidecar polls /api/outbound/pending and actually sends it via
// Oia — safe because the patient messaged us first (warm reply, not cold outreach).
export async function POST(req: Request) {
  const user = await getAdminOrCoordinatorFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { messageId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

  const msg = await db.nIAMessage.findUnique({
    where: { id: body.messageId },
    select: { id: true, metadata: true, session: { select: { identifier: true } } },
  });
  if (!msg) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const meta = (msg.metadata ?? {}) as Record<string, unknown>;
  if (meta.waitlist !== true) return NextResponse.json({ error: 'not a waitlist entry' }, { status: 400 });

  const phone = ((meta.whatsapp as string) || msg.session?.identifier || '').replace(/\s+/g, '');
  if (!phone) return NextResponse.json({ error: 'no phone on this entry' }, { status: 400 });
  const name = (meta.name as string) || '';
  const procedure = (meta.procedure as string) || '';

  const token = mintInviteToken({ phone, name, procedure });
  const link = `${WEB_URL}/concierge?invite=${token}`;
  const firstName = name.split(/\s+/)[0] || 'there';
  const forProc = procedure ? ` for your ${procedure}` : '';
  const message =
    `Hi ${firstName} 🤍 It's Oia — wonderful news, a space has just opened${forProc} and it's your turn. ` +
    `Here's your private link to plan everything with me: ${link}`;

  await db.nIAMessage.update({
    where: { id: msg.id },
    data: {
      metadata: {
        ...meta,
        invited: true,
        invitedAt: new Date().toISOString(),
        invitedBy: user.name ?? user.id,
        inviteLink: link,
        inviteMessage: message,
        inviteStatus: 'queued', // sidecar flips to 'sent'
      },
    },
  });

  return NextResponse.json({ ok: true, status: 'queued', link });
}
