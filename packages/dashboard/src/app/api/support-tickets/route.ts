import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await db.supportTicket.findMany({
    where: { clinicId: coordinator.clinicId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, subject: true, category: true, status: true,
      adminReply: true, repliedAt: true, createdAt: true,
    },
  });
  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body, category } = await req.json();
  if (!subject || !body) return NextResponse.json({ error: 'subject and body are required' }, { status: 400 });

  const ticket = await db.supportTicket.create({
    data: {
      clinicId: coordinator.clinicId,
      submittedBy: coordinator.user.id,
      subject,
      body,
      category: category ?? 'general',
    },
    select: { id: true, subject: true, status: true, createdAt: true },
  });
  return NextResponse.json(ticket, { status: 201 });
}
