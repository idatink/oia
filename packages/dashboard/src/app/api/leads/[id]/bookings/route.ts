import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: params.id, consultation: { clinicId: coordinator.clinicId } },
    select: { consultation: { select: { id: true } } },
  });

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const bookings = await db.booking.findMany({
    where: { consultationId: lead.consultation.id },
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      durationMins: true,
      status: true,
      room: true,
      joinLink: true,
      notes: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json(bookings);
}
