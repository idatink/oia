import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, status: true, aiScore: true, aiPriority: true,
      patientSelectedAt: true, claimedAt: true, createdAt: true,
      consultation: {
        select: {
          clinic: { select: { id: true, name: true } },
          procedure: { select: { name: true } },
          additionalProcedureIds: true,
          patient: {
            select: {
              countryOfResidence: true,
              user: { select: { name: true } },
            },
          },
        },
      },
      offers: { select: { totalPrice: true, currency: true, status: true } },
    },
  });

  return NextResponse.json(leads);
}
