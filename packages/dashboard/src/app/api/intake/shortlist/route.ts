import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// Patient shortlist from the match room ("Send my shortlist to Oia").
// Stage 2 of the match→clinic funnel (see INTAKE_REDESIGN.md): the patient picks
// up to 10 surgeons; the team runs the Stage-3 deep-dive (portfolio, availability,
// indicative packages) team-assisted via the Clinic-mode playbook.
//
// Writes a shortlist-tagged NIA message on the patient's session (visible on the
// dashboard, same pattern as waitlist entries) and queues a WhatsApp confirmation
// through the existing outbound rail.
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    phone?: string;
    name?: string;
    procedure?: string;
    providers?: Array<{ id: string; name: string; country: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = (body.phone ?? '').replace(/\s+/g, '');
  if (!phone.startsWith('+')) return NextResponse.json({ error: 'valid E.164 phone required' }, { status: 400 });
  const providers = (body.providers ?? []).slice(0, 10); // hard cap, server-side too
  if (providers.length === 0) return NextResponse.json({ error: 'empty shortlist' }, { status: 400 });

  // Find the patient's session — whatsapp thread preferred (the durable line), else web.
  let session = await db.nIASession.findUnique({ where: { surface_identifier: { surface: 'whatsapp', identifier: phone } }, select: { id: true } });
  session = session ?? await db.nIASession.findUnique({ where: { surface_identifier: { surface: 'web', identifier: phone } }, select: { id: true } });
  if (!session) return NextResponse.json({ error: 'no session for this patient' }, { status: 404 });

  const names = providers.map(p => p.name).join(', ');
  const firstName = (body.name || '').split(/\s+/)[0] || 'there';

  // 1. The structured shortlist record (dashboard-visible).
  await db.nIAMessage.create({
    data: {
      sessionId: session.id,
      role: 'NIA',
      content: `[patient shortlist — ${providers.length} surgeon(s) for ${body.procedure ?? 'procedure'}: ${names}]`,
      metadata: {
        shortlist: true,
        procedure: body.procedure ?? null,
        providers,
        count: providers.length,
        source: 'match-room',
      },
    },
  });

  // 2. WhatsApp confirmation (existing outbound rail — sidecar sends it).
  const message =
    `Got your shortlist, ${firstName} 🤍 ${providers.length} surgeon${providers.length > 1 ? 's' : ''} — lovely choices. ` +
    `I'm going deeper on each now: real before-and-afters, availability and full packages. I'll bring it all back to you soon.`;
  try {
    await db.nIAMessage.create({
      data: {
        sessionId: session.id,
        role: 'NIA',
        content: `[shortlist confirmation queued]`,
        metadata: { whatsapp: phone, inviteMessage: message, inviteStatus: 'queued', shortlistConfirmation: true },
      },
    });
  } catch (err) {
    console.error('[shortlist] queue confirmation failed', err);
  }

  return NextResponse.json({ ok: true, count: providers.length });
}
