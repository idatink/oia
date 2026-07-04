import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { clinicId: coordinator.clinicId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      entityType: true,
      entityId: true,
      isRead: true,
      createdAt: true,
    },
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids } = await req.json() as { ids?: string[] };

  await db.notification.updateMany({
    where: {
      clinicId: coordinator.clinicId,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
