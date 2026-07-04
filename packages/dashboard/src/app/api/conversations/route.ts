import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const leads = await db.lead.findMany({
    where: {
      consultation: { clinicId: coordinator.clinicId },
      patientSelectedAt: { not: null },
    },
    select: {
      id: true,
      status: true,
      aiPriority: true,
      patientSelectedAt: true,
      claimedAt: true,
      consultation: {
        select: {
          procedure: { select: { name: true } },
          additionalProcedureIds: true,
          patient: {
            select: {
              whatsappNumber: true,
              user: { select: { name: true, phone: true } },
              // get latest Nia message via sessions
              sessions: {
                orderBy: { lastActiveAt: 'desc' },
                take: 1,
                select: {
                  lastActiveAt: true,
                  messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { role: true, content: true, createdAt: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { patientSelectedAt: 'desc' },
  });

  const result = leads.map(l => {
    const session = l.consultation.patient.sessions[0];
    const lastMsg = session?.messages[0] ?? null;
    return {
      id: l.id,
      status: l.status,
      aiPriority: l.aiPriority,
      patientSelectedAt: l.patientSelectedAt,
      patientName: l.consultation.patient.user.name,
      whatsappNumber: l.consultation.patient.whatsappNumber ?? l.consultation.patient.user.phone,
      procedureName: l.consultation.procedure.name,
      additionalCount: l.consultation.additionalProcedureIds.length,
      lastMessage: lastMsg ? { role: lastMsg.role, snippet: lastMsg.content.slice(0, 100), createdAt: lastMsg.createdAt } : null,
      lastActiveAt: session?.lastActiveAt ?? l.patientSelectedAt,
    };
  });

  return NextResponse.json(result);
}
