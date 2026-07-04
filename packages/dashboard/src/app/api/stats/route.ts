import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const GATE = {
    aiScore: { not: null as never },
    medicalScreening: { not: 'DbNull' as never },
    consultation: {
      clinicId: coordinator.clinicId,
      patient: {
        dateOfBirth: { not: null as never },
        countryOfResidence: { not: null as never },
        preferredLanguage: { not: null as never },
      },
    },
  };

  const [totalLeads, selectedLeads, auditLogs] = await Promise.all([
    db.lead.count({ where: GATE }),
    db.lead.count({ where: { ...GATE, status: 'SELECTED' } }),
    db.auditLog.findMany({
      where: {
        action: 'lead.claimed',
        actorRole: 'COORDINATOR',
        entityType: 'Lead',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, entityId: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  // Response time = avg minutes between lead.createdAt and lead.claimedAt
  const leads = await db.lead.findMany({
    where: { ...GATE, claimedAt: { not: null } },
    select: { createdAt: true, claimedAt: true },
    take: 50,
    orderBy: { claimedAt: 'desc' },
  });

  let avgResponseMins: number | null = null;
  if (leads.length > 0) {
    const totalMins = leads.reduce((sum, l) => {
      if (!l.claimedAt) return sum;
      return sum + Math.floor((new Date(l.claimedAt).getTime() - new Date(l.createdAt).getTime()) / 60000);
    }, 0);
    avgResponseMins = Math.round(totalMins / leads.length);
  }

  const conversionRate = totalLeads > 0 ? Math.round((selectedLeads / totalLeads) * 100) : 0;

  return NextResponse.json({
    totalLeads,
    selectedLeads,
    conversionRate,
    avgResponseMins,
    newLeadsCount: await db.lead.count({ where: { ...GATE, status: 'NEW' } }),
    conversationsCount: await db.lead.count({
      where: { ...GATE, patientSelectedAt: { not: null } },
    }),
  });
}
