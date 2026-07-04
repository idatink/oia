import { NextResponse } from 'next/server';
import { getCoordinatorFromRequest } from '@/lib/api-auth';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export type ComponentType = 'announcement-banner' | 'referral-campaign' | 'promo-strip';

export interface SiteComponent {
  id: string;
  type: ComponentType;
  label: string;
  isLive: boolean;
  order: number;
  config: Record<string, unknown>;
  updatedAt: string;
}

function parseComponent(row: { key: string; value: unknown; updatedAt: Date }): SiteComponent {
  const v = row.value as Record<string, unknown>;
  return {
    id: row.key.replace('site.component.', ''),
    type: v.type as ComponentType,
    label: v.label as string,
    isLive: Boolean(v.isLive),
    order: Number(v.order ?? 0),
    config: (v.config ?? {}) as Record<string, unknown>,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.niaConfig.findMany({
    where: { category: 'site-component' },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(rows.map(parseComponent));
}

export async function POST(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: { type: ComponentType; label: string; config: Record<string, unknown> } = await req.json();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const key = `site.component.${id}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = { type: body.type, label: body.label, isLive: false, order: 0, config: body.config } as any;
  await db.niaConfig.create({ data: { key, value, label: body.label, category: 'site-component' } });

  return NextResponse.json({ id, ...value });
}
