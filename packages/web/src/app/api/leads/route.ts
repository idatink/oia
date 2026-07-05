import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export async function POST(req: Request) {
  const { name, email, whatsapp } = await req.json();

  // Anonymous-first (A3): a WhatsApp number is NO LONGER required up front — it
  // is collected later in the chat and attached via /api/link-session. Only
  // name + email are needed to create the patient record here.
  if (!name || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // Upsert patient user — idempotent if they submit the form twice
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, role: 'PATIENT' },
      update: { name },
    });

    // If a number was supplied, use it as the patient identity key (Decision A3);
    // if it already belongs to a patient, reuse that record rather than
    // duplicate-creating (whatsappNumber is @unique → a blind create throws
    // P2002 → 500). With no number, create/keep the patient without one.
    const existingByPhone = whatsapp
      ? await db.patient.findUnique({ where: { whatsappNumber: whatsapp } })
      : null;

    if (!existingByPhone) {
      await db.patient.upsert({
        where: { userId: user.id },
        create: { userId: user.id, whatsappNumber: whatsapp ?? null },
        update: whatsapp ? { whatsappNumber: whatsapp } : {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leads]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
