import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

/**
 * Real-time per-turn conversation sync.
 *
 * Unlike /api/intake/whatsapp (which fires once, at completion, and creates a
 * qualified Lead), this endpoint is called by the WhatsApp gateway's sidecar
 * syncer for EVERY inbound/outbound message as it happens. It upserts a
 * minimal patient + NIASession and appends the single message — so every
 * conversation (including the ones that drop off before completing intake) is
 * visible on the dashboard live, with exactly where it stopped.
 *
 * Idempotent: a message is keyed by (session, messageId); replays are no-ops.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    phone: string;
    role: 'patient' | 'oia' | 'nia' | 'assistant' | 'user';
    content: string;
    messageId?: string;
    name?: string;
    ts?: string | number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.phone || !body.content) {
    return NextResponse.json({ error: 'phone and content are required' }, { status: 400 });
  }

  const phone = body.phone.replace(/\s+/g, '');
  const content = body.content.trim();
  if (!content) {
    return NextResponse.json({ ok: true, skipped: 'empty' });
  }

  const role: 'PATIENT' | 'NIA' =
    body.role === 'patient' || body.role === 'user' ? 'PATIENT' : 'NIA';

  // Upsert a minimal patient keyed by WhatsApp number. Name stays a placeholder
  // (the phone) until create_nia_inquiry fills in the real profile at completion.
  const existingPatient = await db.patient.findUnique({
    where: { whatsappNumber: phone },
    select: { id: true },
  });

  let patientId: string;
  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    const placeholderEmail = `wa_${phone.replace(/[^0-9]/g, '')}@whatsapp.nia.health`;
    const newPatient = await db.patient.create({
      data: {
        whatsappNumber: phone,
        user: {
          create: {
            email: placeholderEmail,
            name: body.name?.trim() || phone,
            phone,
            role: 'PATIENT',
          },
        },
      },
      select: { id: true },
    });
    patientId = newPatient.id;
  }

  const session = await db.nIASession.upsert({
    where: { surface_identifier: { surface: 'whatsapp', identifier: phone } },
    create: { patientId, surface: 'whatsapp', identifier: phone, lastActiveAt: new Date() },
    update: { lastActiveAt: new Date() },
    select: { id: true },
  });

  // Idempotency: skip if this exact message was already streamed.
  if (body.messageId) {
    const dupe = await db.nIAMessage.findFirst({
      where: { sessionId: session.id, metadata: { path: ['messageId'], equals: body.messageId } },
      select: { id: true },
    });
    if (dupe) {
      return NextResponse.json({ ok: true, skipped: 'duplicate', sessionId: session.id });
    }
  }

  const message = await db.nIAMessage.create({
    data: {
      sessionId: session.id,
      role,
      content,
      metadata: {
        realtime: true,
        messageId: body.messageId ?? null,
        ts: body.ts ?? null,
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, sessionId: session.id, messageId: message.id });
}
