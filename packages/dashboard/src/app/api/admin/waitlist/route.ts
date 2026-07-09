import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getAdminOrCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Waitlist leads = people who left their name + WhatsApp number via the web
// concierge while it's in capacity/WAITLIST mode. Those details are persisted by
// the web app onto the NIA-role message's `metadata` as { waitlist: true, name,
// whatsapp, age, procedure, notes } (see packages/web .../api/chat/route.ts).
export async function GET(req: Request) {
  const user = await getAdminOrCoordinatorFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await db.nIAMessage.findMany({
    where: { role: 'NIA', metadata: { path: ['waitlist'], equals: true } },
    include: {
      session: { select: { id: true, surface: true, identifier: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  // A visitor can emit several <WAITLIST> turns as they refine their details, so
  // there may be more than one entry per session. Messages are newest-first, so
  // keeping the first one we see per session yields the latest details.
  const seen = new Set<string>();
  const leads: Array<{
    id: string;
    sessionId: string | null;
    name: string | null;
    whatsapp: string | null;
    age: string | number | null;
    procedure: string | null;
    notes: string | null;
    createdAt: Date;
  }> = [];

  for (const m of messages) {
    const key = m.session?.id ?? m.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const meta = (m.metadata ?? {}) as Record<string, unknown>;
    leads.push({
      id: m.id,
      sessionId: m.session?.id ?? null,
      name: (meta.name as string) ?? null,
      whatsapp: (meta.whatsapp as string) ?? null,
      age: (meta.age as string | number) ?? null,
      procedure: (meta.procedure as string) ?? null,
      notes: (meta.notes as string) ?? null,
      createdAt: m.createdAt,
    });
  }

  return NextResponse.json(leads);
}
