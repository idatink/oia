import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, whatsapp } = await req.json();

  if (!name || !email || !whatsapp) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // TODO: persist to Prisma (Patient + Lead) once db is wired into web app
  // For now, log and return success so the modal flow works end-to-end
  console.log('[lead]', { name, email, whatsapp });

  return NextResponse.json({ ok: true });
}
