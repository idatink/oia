import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: {
      id: params.id,
      aiScore: { not: null },
      medicalScreening: { not: 'DbNull' as never },
      consultation: {
        clinicId: coordinator.clinicId,
        patient: { dateOfBirth: { not: null }, countryOfResidence: { not: null }, preferredLanguage: { not: null } },
      },
    },
    select: { id: true, status: true, coordinatorId: true },
  });

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (lead.status !== 'NEW') return NextResponse.json({ error: 'Lead already claimed' }, { status: 409 });

  const updated = await db.lead.update({
    where: { id: params.id },
    data: { status: 'CLAIMED', coordinatorId: coordinator.id, claimedAt: new Date() },
    select: { id: true, status: true, claimedAt: true },
  });

  await db.auditLog.create({
    data: {
      actorId: coordinator.user.id,
      actorRole: 'COORDINATOR',
      action: 'lead.claimed',
      entityType: 'Lead',
      entityId: params.id,
    },
  });

  return NextResponse.json(updated);
}
