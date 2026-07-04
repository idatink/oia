import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export async function GET() {
  const tickets = await db.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, subject: true, body: true, category: true,
      status: true, adminReply: true, repliedAt: true, createdAt: true,
      clinic: { select: { name: true, id: true } },
    },
  });
  return NextResponse.json(tickets);
}

export async function PATCH(req: Request) {
  const { id, status, adminReply } = await req.json();
  const ticket = await db.supportTicket.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminReply !== undefined ? { adminReply, repliedAt: new Date() } : {}),
    },
  });
  return NextResponse.json(ticket);
}
