import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const patients = await db.patient.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, dateOfBirth: true, countryOfResidence: true,
      preferredLanguage: true, whatsappNumber: true, createdAt: true,
      user: { select: { name: true, email: true, phone: true } },
      consultations: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true,
          procedure: { select: { name: true } },
          clinic: { select: { name: true } },
          lead: {
            select: {
              id: true, status: true, aiScore: true, aiPriority: true,
              medicalScreening: true, patientSelectedAt: true, createdAt: true,
            },
          },
        },
      },
    },
  });

  const enriched = patients.map(p => {
    const allLeads = p.consultations.flatMap(c => c.lead ? [c.lead] : []);
    const isComplete = Boolean(
      p.dateOfBirth && p.countryOfResidence && p.preferredLanguage &&
      allLeads.some(l => l.aiScore !== null && l.medicalScreening !== null)
    );
    return { ...p, isComplete, leadCount: allLeads.length };
  });

  return NextResponse.json(enriched);
}
