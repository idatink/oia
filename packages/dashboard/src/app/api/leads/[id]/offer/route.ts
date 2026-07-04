import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const offers = await db.offer.findMany({
    where: { leadId: params.id, clinicId: coordinator.clinicId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(offers);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the lead belongs to this clinic
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
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { totalPrice, currency, inclusions, notes, validDays } = body;

  if (!totalPrice || typeof totalPrice !== 'number' || totalPrice <= 0) {
    return NextResponse.json({ error: 'totalPrice must be a positive number' }, { status: 400 });
  }

  // Upsert: one offer per clinic per lead — update if exists, create if not
  const existing = await db.offer.findFirst({
    where: { leadId: params.id, clinicId: coordinator.clinicId },
    select: { id: true },
  });

  const offerData = {
    totalPrice: Number(totalPrice),
    currency: currency ?? 'EUR',
    inclusions: Array.isArray(inclusions) ? inclusions : [],
    notes: notes ?? null,
    validDays: validDays ?? 30,
    status: 'SENT',
    sentAt: new Date(),
  };

  const offer = existing
    ? await db.offer.update({ where: { id: existing.id }, data: offerData })
    : await db.offer.create({
        data: {
          ...offerData,
          leadId: params.id,
          clinicId: coordinator.clinicId,
          coordinatorId: coordinator.id,
        },
      });

  return NextResponse.json(offer, { status: existing ? 200 : 201 });
}
