import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await db.nIASession.findUnique({
    where: { id: params.sessionId },
    include: {
      patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, metadata: true, createdAt: true },
      },
    },
  });

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: session.id,
    surface: session.surface,
    identifier: session.identifier,
    patientName: session.patient.user.name,
    patientEmail: session.patient.user.email,
    patientPhone: session.patient.user.phone,
    lastActiveAt: session.lastActiveAt,
    createdAt: session.createdAt,
    messages: session.messages,
  });
}
