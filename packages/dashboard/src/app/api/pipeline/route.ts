import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

// Maps ConsultationStatus → pipeline column key
const STATUS_TO_COL: Record<string, string> = {
  ENQUIRY: 'ENQUIRY',
  CONTACTED: 'ENQUIRY',
  CONSULTATION_BOOKED: 'CONSULTATION',
  CONSULTATION_DONE: 'CONSULTATION',
  DEPOSIT_PAID: 'CONFIRMED',
  CONFIRMED: 'CONFIRMED',
  PRE_OP: 'PRE_OP',
  IN_TREATMENT: 'PRE_OP',
  POST_OP: 'POST_OP',
  COMPLETED: 'POST_OP',
  CANCELLED: 'CANCELLED',
};

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const leads = await db.lead.findMany({
    where: {
      status: { not: 'NEW' },
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
      claimedAt: true,
      consultation: {
        select: {
          status: true,
          procedure: { select: { name: true } },
          patient: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { claimedAt: 'desc' },
  });

  const columns: Record<string, typeof leads> = {
    ENQUIRY: [],
    CONSULTATION: [],
    CONFIRMED: [],
    PRE_OP: [],
    POST_OP: [],
  };

  for (const lead of leads) {
    const col = STATUS_TO_COL[lead.consultation.status] ?? 'ENQUIRY';
    if (col !== 'CANCELLED' && columns[col]) {
      columns[col].push(lead);
    }
  }

  return NextResponse.json(columns);
}
