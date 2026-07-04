import { NextResponse } from 'next/server';
import { verifySession, COOKIE } from '@/lib/session';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ id: session.id, name: session.name, role: session.role });
}
