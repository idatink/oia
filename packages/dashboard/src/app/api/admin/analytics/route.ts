import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [totalLeads, totalClinics, totalPatients, totalOffers, leadsByStatus, leadsByDay] = await Promise.all([
    db.lead.count(),
    db.clinic.count({ where: { isActive: true } }),
    db.patient.count(),
    db.offer.aggregate({ _count: true, _avg: { totalPrice: true }, _sum: { totalPrice: true } }),
    db.lead.groupBy({ by: ['status'], _count: true }),
    db.lead.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600000) } },
      select: { createdAt: true, patientSelectedAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const selectedLeads = await db.lead.count({ where: { patientSelectedAt: { not: null } } });
  const conversionRate = totalLeads > 0 ? Math.round((selectedLeads / totalLeads) * 100) : 0;

  // Group by day for chart
  const byDay: Record<string, { leads: number; selected: number }> = {};
  for (const l of leadsByDay) {
    const day = l.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { leads: 0, selected: 0 };
    byDay[day].leads++;
    if (l.patientSelectedAt) byDay[day].selected++;
  }

  return NextResponse.json({
    totalLeads,
    totalClinics,
    totalPatients,
    selectedLeads,
    conversionRate,
    avgOfferPrice: Math.round(totalOffers._avg.totalPrice ?? 0),
    totalOffersSent: totalOffers._count,
    totalRevenue: Math.round(totalOffers._sum.totalPrice ?? 0),
    leadsByStatus: leadsByStatus.map(s => ({ status: s.status, count: s._count })),
    byDay: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
  });
}
