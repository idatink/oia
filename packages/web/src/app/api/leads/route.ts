import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export async function POST(req: Request) {
  const { name, email, whatsapp } = await req.json();

  if (!name || !email || !whatsapp) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // Upsert patient user — idempotent if they submit the form twice
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, role: 'PATIENT' },
      update: { name },
    });

    // WhatsApp number is the patient's identity key (Decision A3): if it already
    // belongs to a patient, reuse that record rather than creating a duplicate.
    // whatsappNumber is @unique, so a blind create otherwise throws P2002 → 500.
    const existingByPhone = await db.patient.findUnique({
      where: { whatsappNumber: whatsapp },
    });

    if (!existingByPhone) {
      await db.patient.upsert({
        where: { userId: user.id },
        create: { userId: user.id, whatsappNumber: whatsapp },
        update: { whatsappNumber: whatsapp },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leads]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
