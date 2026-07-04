import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const leads = await db.lead.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      // Only show leads where Nia has completed intake: AI scored, medically screened,
      // and patient has provided DOB, country, and language. Incomplete profiles stay invisible to clinics.
      aiScore: { not: null },
      medicalScreening: { not: 'DbNull' as never },
      consultation: {
        clinicId: coordinator.clinicId,
        patient: {
          dateOfBirth: { not: null },
          countryOfResidence: { not: null },
          preferredLanguage: { not: null },
        },
      },
    },
    select: {
      id: true,
      status: true,
      source: true,
      patientLocation: true,
      aiScore: true,
      aiPriority: true,
      photoUrls: true,
      medicalScreening: true,
      claimedAt: true,
      createdAt: true,
      consultation: {
        select: {
          additionalProcedureIds: true,
          procedure: { select: { name: true } },
          patient: {
            select: {
              countryOfResidence: true,
              preferredLanguage: true,
              dateOfBirth: true,
              whatsappNumber: true,
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(leads);
}
