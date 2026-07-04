import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

const GATE = (clinicId: string) => ({
  aiScore: { not: null as never },
  medicalScreening: { not: 'DbNull' as never },
  consultation: {
    clinicId,
    patient: {
      dateOfBirth: { not: null as never },
      countryOfResidence: { not: null as never },
      preferredLanguage: { not: null as never },
    },
  },
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: params.id, ...GATE(coordinator.clinicId) },
    select: { id: true, proposal: true },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead.proposal ?? null);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: params.id, patientSelectedAt: { not: null }, ...GATE(coordinator.clinicId) },
    select: { id: true, status: true },
  });
  if (!lead) return NextResponse.json({ error: 'Not found or patient has not selected this clinic' }, { status: 404 });

  const body = await req.json() as {
    timeline: string; preOpInstructions: string; hospitalStay: string;
    recoveryPlan: string; followUpSchedule: string; notes?: string;
  };

  const proposal = {
    ...body,
    sentAt: new Date().toISOString(),
    sentBy: coordinator.user.name,
  };

  const updated = await db.lead.update({
    where: { id: params.id },
    data: { proposal },
    select: { id: true, proposal: true },
  });

  await db.auditLog.create({
    data: {
      actorId: coordinator.user.id,
      actorRole: 'COORDINATOR',
      action: 'lead.proposal_sent',
      entityType: 'Lead',
      entityId: params.id,
    },
  });

  return NextResponse.json(updated.proposal);
}
