import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const surface = searchParams.get('surface'); // 'web' | 'whatsapp' | null (all)
  const search = searchParams.get('q') ?? '';

  const sessions = await db.nIASession.findMany({
    where: {
      ...(surface ? { surface } : {}),
      ...(search ? {
        patient: { user: { name: { contains: search, mode: 'insensitive' } } },
      } : {}),
    },
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { role: true, content: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastActiveAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(sessions.map(s => ({
    id: s.id,
    surface: s.surface,
    identifier: s.identifier,
    patientName: s.patient.user.name,
    patientEmail: s.patient.user.email,
    messageCount: s._count.messages,
    lastActiveAt: s.lastActiveAt,
    lastMessage: s.messages[0] ?? null,
    createdAt: s.createdAt,
  })));
}
