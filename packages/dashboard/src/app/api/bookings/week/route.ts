import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start'); // YYYY-MM-DD (Monday)
  if (!start) return NextResponse.json({ error: 'start required' }, { status: 400 });

  const monday = new Date(`${start}T00:00:00Z`);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 7);

  const bookings = await db.booking.findMany({
    where: {
      scheduledAt: { gte: monday, lt: sunday },
      consultation: {
        clinicId: coordinator.clinicId,
        patient: {
          dateOfBirth: { not: null },
          countryOfResidence: { not: null },
          preferredLanguage: { not: null },
        },
        lead: {
          aiScore: { not: null },
          medicalScreening: { not: 'DbNull' as never },
        },
      },
    },
    select: { scheduledAt: true },
  });

  // Build counts map keyed YYYY-MM-DD (UTC)
  const counts: Record<string, number> = {};
  for (const b of bookings) {
    const key = b.scheduledAt.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json(counts);
}
