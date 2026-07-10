import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// WhatsApp waitlist capture. While Oia is at capacity, a patient who taps
// "Continue on WhatsApp" messages her, and she collects name + email + intention.
// She then calls the `join_waitlist` skill, which POSTs here. We record it the
// same way the web concierge records a <WAITLIST> turn — a NIA-role message with
// metadata.waitlist=true — so it shows in the shared Admin → Waitlist view
// (see packages/dashboard .../api/admin/waitlist/route.ts).
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { phone?: string; name?: string; email?: string; procedure?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = (body.phone ?? '').replace(/\s+/g, '');
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  // Upsert the patient (keyed by WhatsApp number) and their whatsapp session.
  const existingPatient = await db.patient.findUnique({ where: { whatsappNumber: phone }, select: { id: true } });
  let patientId: string;
  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    const placeholderEmail = `wa_${phone.replace(/[^0-9]/g, '')}@whatsapp.nia.health`;
    const newPatient = await db.patient.create({
      data: {
        whatsappNumber: phone,
        user: { create: { email: placeholderEmail, name: body.name?.trim() || phone, phone, role: 'PATIENT' } },
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

  const metadata = {
    waitlist: true,
    name: body.name?.trim() || null,
    whatsapp: phone,
    email: body.email?.trim() || null,
    procedure: body.procedure?.trim() || null,
    notes: body.notes?.trim() || null,
    source: 'whatsapp',
  };

  // One waitlist record per session — update it if they refine their details.
  const existing = await db.nIAMessage.findFirst({
    where: { sessionId: session.id, role: 'NIA', metadata: { path: ['waitlist'], equals: true } },
    select: { id: true },
  });
  if (existing) {
    await db.nIAMessage.update({ where: { id: existing.id }, data: { metadata } });
  } else {
    await db.nIAMessage.create({
      data: { sessionId: session.id, role: 'NIA', content: `Waitlist — ${metadata.procedure ?? 'interested'}`, metadata },
    });
  }

  return NextResponse.json({ ok: true, sessionId: session.id });
}
