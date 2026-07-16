import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { mintCompareToken } from '@nia/shared/src/compareToken';
import { getAdminOrCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const WEB_URL = (process.env.NIA_WEB_URL ?? 'https://oia-web-eight.vercel.app').replace(/\/+$/, '');

// Stage-3 deep-dive delivery (see INTAKE_REDESIGN.md → match→clinic funnel).
// GET  → recent patient shortlists (the team's work queue for the compare form).
// POST → store the team's deep-dive entries as a compare record on the patient's
//        session, mint a signed /compare/<token> link, queue the WhatsApp ping.

export async function GET(req: Request) {
  const user = await getAdminOrCoordinatorFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.nIAMessage.findMany({
    where: { metadata: { path: ['shortlist'], equals: true } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, createdAt: true, metadata: true,
      session: { select: { identifier: true, patient: { select: { user: { select: { name: true } } } } } },
    },
  });

  const shortlists = rows.map(r => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    return {
      messageId: r.id,
      createdAt: r.createdAt,
      phone: r.session?.identifier ?? null,
      patientName: r.session?.patient?.user?.name ?? null,
      procedure: (meta.procedure as string) ?? null,
      providers: (meta.providers as Array<{ id: string; name: string; country: string }>) ?? [],
    };
  });
  return NextResponse.json({ shortlists });
}

export interface CompareEntry {
  name: string;
  country?: string;
  city?: string;
  price?: string;      // e.g. "£4,200" — free text, entered by the team from real quotes
  includes?: string;   // "surgeon fee, 2 nights hospital, transfers, garments"
  availability?: string; // "from late August"
  notes?: string;
}

export async function POST(req: Request) {
  const user = await getAdminOrCoordinatorFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { phone?: string; name?: string; procedure?: string; entries?: CompareEntry[]; deliverWhatsApp?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = (body.phone ?? '').replace(/\s+/g, '');
  if (!phone.startsWith('+')) return NextResponse.json({ error: 'valid E.164 phone required' }, { status: 400 });
  const entries = (body.entries ?? []).filter(e => e && e.name).slice(0, 10);
  if (entries.length === 0) return NextResponse.json({ error: 'no entries' }, { status: 400 });

  let session = await db.nIASession.findUnique({ where: { surface_identifier: { surface: 'whatsapp', identifier: phone } }, select: { id: true } });
  session = session ?? await db.nIASession.findUnique({ where: { surface_identifier: { surface: 'web', identifier: phone } }, select: { id: true } });
  if (!session) return NextResponse.json({ error: 'no session for this patient' }, { status: 404 });

  // 1. The compare record (source of truth the web page renders).
  const record = await db.nIAMessage.create({
    data: {
      sessionId: session.id,
      role: 'NIA',
      content: `[deep-dive comparison — ${entries.length} option(s) for ${body.procedure ?? 'procedure'}]`,
      metadata: { compare: true, procedure: body.procedure ?? null, name: body.name ?? null, entries: entries as unknown as object },
    },
  });

  const token = mintCompareToken({ phone, id: record.id, name: body.name, procedure: body.procedure });
  const link = `${WEB_URL}/compare/${token}`;

  // 2. WhatsApp ping (existing outbound rail).
  let whatsappQueued = false;
  if (body.deliverWhatsApp !== false) {
    const firstName = (body.name || '').split(/\s+/)[0] || 'there';
    const message =
      `${firstName}, your comparison is ready 🤍 I've gone deep on your shortlist — ` +
      `packages, availability and the details, side by side: ${link}`;
    try {
      await db.nIAMessage.create({
        data: {
          sessionId: session.id,
          role: 'NIA',
          content: '[compare link queued]',
          metadata: { whatsapp: phone, inviteMessage: message, inviteStatus: 'queued', compareDelivery: true },
        },
      });
      whatsappQueued = true;
    } catch (err) {
      console.error('[admin/compare] queue failed', err);
    }
  }

  return NextResponse.json({ ok: true, link, compareId: record.id, whatsappQueued });
}
