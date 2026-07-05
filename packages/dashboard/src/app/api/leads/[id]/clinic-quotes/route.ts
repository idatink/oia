import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

// Clinic negotiations Oia ran for this lead's patient, stored as
// NIASession(surface="clinic") + the structured quote on a message's metadata.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: params.id, consultation: { clinicId: coordinator.clinicId } },
    select: { consultation: { select: { patientId: true } } },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sessions = await db.nIASession.findMany({
    where: { surface: 'clinic', patientId: lead.consultation.patientId },
    orderBy: { lastActiveAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  const quotes = sessions.map(s => {
    const quoteMsg = [...s.messages].reverse().find(
      m => m.metadata && (m.metadata as { type?: string }).type === 'clinic_quote'
    );
    const transcript = s.messages
      .filter(m => !(m.metadata && (m.metadata as { type?: string }).type === 'clinic_quote'))
      .map(m => ({ role: m.role, content: m.content, createdAt: m.createdAt }));
    return {
      sessionId: s.id,
      lastActiveAt: s.lastActiveAt,
      quote: quoteMsg?.metadata ?? null,
      transcript,
    };
  });

  return NextResponse.json(quotes);
}
