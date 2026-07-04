import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: {
      id: params.id,
      consultation: {
        clinicId: coordinator.clinicId,
        patient: {
          dateOfBirth: { not: null },
          countryOfResidence: { not: null },
          preferredLanguage: { not: null },
        },
      },
      aiScore: { not: null },
      medicalScreening: { not: 'DbNull' as never },
    },
    select: {
      id: true,
      status: true,
      source: true,
      patientLocation: true,
      aiScore: true,
      aiRationale: true,
      aiPriority: true,
      intent: true,
      scope: true,
      medicalScreening: true,
      photoUrls: true,
      claimedAt: true,
      patientSelectedAt: true,
      closedAt: true,
      closureOutcome: true,
      closureNotes: true,
      departureDate: true,
      followUpDays: true,
      proposal: true,
      createdAt: true,
      coordinator: { select: { user: { select: { name: true } } } },
      consultation: {
        select: {
          id: true,
          status: true,
          preferredDoctorName: true,
          additionalProcedureIds: true,
          procedure: { select: { name: true } },
          patient: {
            select: {
              dateOfBirth: true,
              countryOfResidence: true,
              preferredLanguage: true,
              whatsappNumber: true,
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve additional procedure names
  let additionalProcedures: { id: string; name: string }[] = [];
  if (lead.consultation.additionalProcedureIds.length > 0) {
    additionalProcedures = await db.procedure.findMany({
      where: { id: { in: lead.consultation.additionalProcedureIds } },
      select: { id: true, name: true },
    });
  }

  return NextResponse.json({ ...lead, additionalProcedures });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
    select: { id: true, status: true },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    status?: string;
    closureOutcome?: string;
    closureNotes?: string;
    departureDate?: string;
    followUpDays?: number[];
  };

  const data: Record<string, unknown> = {};

  if (body.status === 'CLOSED') {
    if (!['IN_PROGRESS', 'SELECTED', 'ESCALATED'].includes(lead.status)) {
      return NextResponse.json({ error: 'Cannot close a lead in this status' }, { status: 409 });
    }
    data.status = 'CLOSED';
    data.closedAt = new Date();
    data.closureOutcome = body.closureOutcome ?? 'successful';
    data.closureNotes = body.closureNotes ?? null;
    data.departureDate = body.departureDate ? new Date(body.departureDate) : null;
    data.followUpDays = body.followUpDays ?? [];

    await db.auditLog.create({
      data: {
        actorId: coordinator.user.id,
        actorRole: 'COORDINATOR',
        action: 'lead.closed',
        entityType: 'Lead',
        entityId: params.id,
      },
    });
  } else if (body.followUpDays !== undefined) {
    data.followUpDays = body.followUpDays;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const updated = await db.lead.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
