import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: params.id, consultation: { clinicId: coordinator.clinicId } },
    select: {
      patientSelectedAt: true,
      consultation: {
        select: {
          patient: { select: { id: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!lead.patientSelectedAt) return NextResponse.json({ error: 'Conversation not yet accessible — patient has not selected this clinic' }, { status: 403 });

  const sessions = await db.nIASession.findMany({
    where: { patientId: lead.consultation.patient.id },
    select: {
      surface: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, metadata: true, createdAt: true },
      },
    },
  });

  const messages = sessions.flatMap(s => s.messages).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Determine the primary surface (most recently active session)
  const surface = sessions.length > 0 ? sessions[sessions.length - 1].surface : 'web';

  return NextResponse.json({
    patientName: lead.consultation.patient.user.name,
    patientSelectedAt: lead.patientSelectedAt,
    surface,
    messages,
  });
}
