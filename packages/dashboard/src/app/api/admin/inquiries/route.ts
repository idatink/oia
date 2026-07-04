import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { verifySession, COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  const session = match?.[1] ? await verifySession(match[1]) : null;
  if (!session || (session.role !== 'ADMIN' && session.role !== 'NIA_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await db.nIASession.findMany({
    where: { surface: { in: ['whatsapp', 'web'] } },
    orderBy: { lastActiveAt: 'desc' },
    include: {
      patient: {
        select: {
          id: true,
          countryOfResidence: true,
          preferredLanguage: true,
          user: { select: { name: true, phone: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, metadata: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(sessions);
}
