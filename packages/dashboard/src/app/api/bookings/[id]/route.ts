import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await db.booking.findFirst({
    where: { id: params.id, consultation: { clinicId: coordinator.clinicId } },
    select: { id: true },
  });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { scheduledAt?: string; status?: string; notes?: string };

  const updated = await db.booking.update({
    where: { id: params.id },
    data: {
      ...(body.scheduledAt ? { scheduledAt: new Date(body.scheduledAt) } : {}),
      ...(body.status ? { status: body.status as never } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    select: { id: true, scheduledAt: true, status: true },
  });

  return NextResponse.json(updated);
}
