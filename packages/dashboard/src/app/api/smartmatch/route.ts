import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { smartMatch, type PatientProfile } from '@nia/shared/src/smartmatch';

export const dynamic = 'force-dynamic';

// SmartMatch: given a patient profile, return the ranked provider shortlist.
// Called by Oia's `smart_match` skill (WhatsApp). When a `phone` is supplied,
// the shortlist is persisted (ProviderMatch) so the team has a structured
// record to run the negotiation on — not just chat text.
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PatientProfile & { phone?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await smartMatch(body, Math.min(body.limit ?? 3, 5));

  // Persist the shortlist against the patient so the team can act on it.
  if (body.phone && result.treatment && result.providers.length > 0) {
    try {
      const phone = body.phone.replace(/\s+/g, '');
      let patient = await db.patient.findUnique({ where: { whatsappNumber: phone }, select: { id: true } });
      if (!patient) {
        const placeholderEmail = `wa_${phone.replace(/[^0-9]/g, '')}@whatsapp.nia.health`;
        patient = await db.patient.create({
          data: { whatsappNumber: phone, user: { create: { email: placeholderEmail, name: phone, phone, role: 'PATIENT' } } },
          select: { id: true },
        });
      }
      await db.providerMatch.create({
        data: {
          patientId: patient.id,
          phone,
          treatmentName: result.treatment.name,
          treatmentSlug: result.treatment.slug,
          cluster: result.cluster,
          items: {
            create: result.providers.map((p, i) => ({
              providerId: p.id, rank: i + 1, score: p.score, reasons: p.reasons,
            })),
          },
        },
      });
    } catch (err) {
      console.error('[smartmatch] persist failed', err);
    }
  }

  return NextResponse.json(result);
}
