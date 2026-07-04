import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const lead = await db.lead.findUnique({
    where: { id: params.id },
    select: {
      id: true, status: true, source: true, patientLocation: true,
      aiScore: true, aiRationale: true, aiPriority: true,
      intent: true, scope: true, medicalScreening: true, photoUrls: true,
      claimedAt: true, patientSelectedAt: true, createdAt: true, updatedAt: true,
      proposal: true, closedAt: true, closureOutcome: true, closureNotes: true,
      departureDate: true, followUpDays: true,
      coordinator: { select: { user: { select: { name: true, email: true } } } },
      offers: {
        orderBy: { sentAt: 'desc' },
        select: {
          id: true, totalPrice: true, currency: true, inclusions: true,
          notes: true, validDays: true, status: true, sentAt: true,
          coordinator: { select: { user: { select: { name: true } } } },
        },
      },
      consultation: {
        select: {
          id: true, status: true, preferredDoctorName: true,
          additionalProcedureIds: true, notes: true,
          procedure: { select: { id: true, name: true, category: true } },
          clinic: { select: { id: true, name: true, city: true, country: true } },
          patient: {
            select: {
              id: true, dateOfBirth: true, countryOfResidence: true,
              preferredLanguage: true, whatsappNumber: true, nationality: true,
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
        },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // All leads for the same patient (competing clinics)
  const competingLeads = await db.lead.findMany({
    where: {
      id: { not: params.id },
      consultation: { patientId: lead.consultation.patient.id },
    },
    select: {
      id: true, status: true, aiScore: true, patientSelectedAt: true, claimedAt: true,
      offers: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { totalPrice: true, currency: true, status: true, inclusions: true },
      },
      consultation: {
        select: {
          clinic: { select: { id: true, name: true, city: true, country: true } },
          procedure: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ ...lead, competingLeads });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json() as {
    aiScore?: number; aiPriority?: string; aiRationale?: string;
    status?: string; selectClinic?: boolean;
  };

  if (body.selectClinic) {
    // Get patientId for this lead to clear competing leads
    const lead = await db.lead.findUnique({
      where: { id: params.id },
      select: { consultation: { select: { patientId: true } } },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Clear patientSelectedAt on all other leads for this patient
    const otherLeads = await db.lead.findMany({
      where: { id: { not: params.id }, consultation: { patientId: lead.consultation.patientId } },
      select: { id: true },
    });
    if (otherLeads.length > 0) {
      await db.lead.updateMany({
        where: { id: { in: otherLeads.map(l => l.id) } },
        data: { patientSelectedAt: null },
      });
    }

    const updated = await db.lead.update({
      where: { id: params.id },
      data: { patientSelectedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        actorRole: 'ADMIN',
        action: 'lead.clinic_selected',
        entityType: 'Lead',
        entityId: params.id,
      },
    });

    return NextResponse.json({ patientSelectedAt: updated.patientSelectedAt });
  }

  // AI scoring / status update
  const data: Record<string, unknown> = {};
  if (body.aiScore !== undefined) data.aiScore = body.aiScore;
  if (body.aiPriority !== undefined) data.aiPriority = body.aiPriority;
  if (body.aiRationale !== undefined) data.aiRationale = body.aiRationale;
  if (body.status !== undefined) data.status = body.status;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const updated = await db.lead.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
