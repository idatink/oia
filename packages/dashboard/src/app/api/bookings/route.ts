import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date'); // YYYY-MM-DD

  // Default to today in UTC
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

  const bookings = await db.booking.findMany({
    where: {
      scheduledAt: { gte: dayStart, lte: dayEnd },
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
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      durationMins: true,
      status: true,
      room: true,
      joinLink: true,
      notes: true,
      consultation: {
        select: {
          id: true,
          lead: {
            select: { id: true },
          },
          procedure: { select: { name: true } },
          patient: {
            select: {
              whatsappNumber: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json(bookings);
}
