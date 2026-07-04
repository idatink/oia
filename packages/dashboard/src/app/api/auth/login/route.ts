import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@nia/shared/src/db';
import { createSession, COOKIE } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role !== 'COORDINATOR' && user.role !== 'SURGEON' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('[login] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
