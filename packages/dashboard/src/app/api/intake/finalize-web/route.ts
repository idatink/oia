import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { smartMatch } from '@nia/shared/src/smartmatch';
import { mintMatchToken } from '@nia/shared/src/matchToken';
import { reconcileSession } from '@/lib/reconcile-intake';

export const dynamic = 'force-dynamic';

const WEB_URL = (process.env.NIA_WEB_URL ?? 'https://oia-web-eight.vercel.app').replace(/\/+$/, '');

// Finalize a WEB intake: rescue the session into a Lead (the reconciler handles the
// common case where Oia, on Qwen, ended the intake without emitting <INTAKE>), run
// SmartMatch, then DELIVER the shortlist to the patient — a durable match-room link
// queued to their WhatsApp (the sidecar sends it, warm reply). Returns the match
// token + procedure/country so the web chat can also render the surgeons inline.
//
// Auth: shared WhatsApp secret (same as the other intake endpoints).
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { phone?: string; name?: string; procedure?: string; country?: string; deliverWhatsApp?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = (body.phone ?? '').replace(/\s+/g, '');
  if (!phone.startsWith('+')) {
    return NextResponse.json({ error: 'valid E.164 phone required' }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  // The web session was migrated to the phone by /api/link-session before this call.
  const session = await db.nIASession.findUnique({
    where: { surface_identifier: { surface: 'web', identifier: phone } },
    select: { id: true },
  });

  // Rescue → Lead + SmartMatch persist. Best-effort: even if this skips (e.g. a
  // Lead already exists from a clean <INTAKE>), we still deliver matches below.
  let procedure = body.procedure ?? '';
  let country = body.country;
  let name = body.name;
  if (session) {
    try {
      const r = await reconcileSession(session.id, origin, { allowWeb: true });
      if (r.action === 'created') {
        procedure = procedure || r.procedure;
        country = country ?? r.country;
        name = name ?? r.name;
      }
    } catch (err) {
      console.error('[finalize-web] reconcile failed', err);
    }
  }

  if (!procedure) {
    return NextResponse.json({ error: 'no procedure to match on' }, { status: 400 });
  }

  // Run SmartMatch for the shortlist we deliver (persisted separately by the
  // reconciler's /api/smartmatch call; here we just need the count + a valid token).
  let providerCount = 0;
  try {
    const result = await smartMatch({ procedure, country }, 5);
    providerCount = result.providers.length;
  } catch (err) {
    console.error('[finalize-web] smartMatch failed', err);
  }

  const token = mintMatchToken({ procedure, country, name });
  const link = `${WEB_URL}/matches/${token}`;

  // Deliver to the patient's WhatsApp (durable saved link). Queued the same way as
  // the "invite back" message; the Fly sidecar polls /api/outbound/pending.
  if (body.deliverWhatsApp !== false && session && providerCount > 0) {
    const firstName = (name || '').split(/\s+/)[0] || 'there';
    const message =
      `${firstName}, your surgeon matches are ready 🤍 ` +
      `I've hand-picked the surgeons who best fit your goals — view them here: ${link}`;
    try {
      await db.nIAMessage.create({
        data: {
          sessionId: session.id,
          role: 'NIA',
          content: `[match shortlist delivered — ${procedure}]`,
          metadata: {
            matchDelivered: true,
            whatsapp: phone,
            inviteMessage: message,
            inviteStatus: 'queued',
            matchLink: link,
          },
        },
      });
    } catch (err) {
      console.error('[finalize-web] queue whatsapp failed', err);
    }
  }

  return NextResponse.json({ ok: true, matchToken: token, link, procedure, country: country ?? null, providerCount });
}
