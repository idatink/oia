import { NextResponse } from 'next/server';
import { getCoordinatorFromRequest } from '@/lib/api-auth';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const key = `site.component.${params.id}`;
  const existing = await db.niaConfig.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates = await req.json();
  const merged = { ...(existing.value as object), ...updates };

  await db.niaConfig.update({ where: { key }, data: { value: merged } });
  return NextResponse.json({ ok: true, id: params.id, ...merged });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const key = `site.component.${params.id}`;
  await db.niaConfig.deleteMany({ where: { key } });
  return NextResponse.json({ ok: true });
}
